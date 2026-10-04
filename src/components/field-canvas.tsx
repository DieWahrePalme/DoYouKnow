import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Easing, useDerivedValue, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated';

import { FIELD_VARIANTS, FieldVariantName, variantToArray } from '@/constants/field-variants';
import { ColorScheme } from '@/constants/theme';

/** Cross-fade between two looks when the tab changes. */
const VARIANT_FADE_MS = 700;

/** Seconds of drift added per real second: low on purpose, the field should breathe, not race. */
const DRIFT_SPEED = 0.35;
/** Cap on one frame's time step, so resuming after a pause doesn't jump the field. */
const MAX_FRAME_STEP_S = 0.1;

// Topographic contour lines: value-noise fbm, iso-lines where fract(height * N)
// is near 0.5, tinted blue -> violet along a slowly moving diagonal. The bottom
// fades out so lists and tab bar stay readable.
const SOURCE = Skia.RuntimeEffect.Make(`
uniform float2 size;
uniform float t;
uniform float3 blue;
uniform float3 violet;
uniform float levelsU;
uniform float glowU;
uniform float widthU;
uniform float intensityU;
uniform float washU;
uniform float3 baseU;

float hash(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float height(float2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 2; i++) {
    v += amp * noise(p);
    p = p * 2.03 + float2(17.1, 9.2);
    amp *= 0.5;
  }
  return v;
}

half4 main(float2 xy) {
  float2 uv = xy / size.y;
  float2 p = uv * 1.7 + float2(t * 0.020, -t * 0.014);
  float h = height(p) + 0.15 * sin(uv.x * 2.4 + t * 0.05);

  // Screen-space distance to the nearest contour: divide by the height
  // gradient so lines stay hairline-thin on steep and flat ground alike.
  float e = 0.01;
  float2 grad = float2(height(p + float2(e, 0.0)) - height(p - float2(e, 0.0)),
                       height(p + float2(0.0, e)) - height(p - float2(0.0, e))) / (2.0 * e);
  float levels = levelsU;
  float d = abs(fract(h * levels) - 0.5) / levels / max(length(grad) * 2.4, 0.02);
  float line = 1.0 - smoothstep(0.0012 * widthU, 0.0042 * widthU, d);
  float glow = 1.0 - smoothstep(0.004, 0.03, d);

  float mixer = clamp(0.5 + 0.9 * sin(uv.x * 1.6 + uv.y * 1.3 - t * 0.05), 0.0, 1.0);
  float3 tint = mix(blue, violet, mixer);

  float fade = 1.0 - smoothstep(0.30, 1.0, xy.y / size.y);
  fade = 0.18 + 0.82 * fade;

  // Lines on the base colour, plus a soft colour glow near the top.
  float lineAlpha = clamp((line + glow * glowU) * fade * intensityU, 0.0, 1.0);
  float washAlpha = washU * (1.0 - smoothstep(0.0, 0.75, xy.y / size.y));
  float3 color = mix(baseU, tint, washAlpha);
  color = mix(color, tint, lineAlpha);
  return half4(half3(color), 1.0);
}
`)!;

interface FieldCanvasProps {
  width: number;
  height: number;
  /** True stops the clock (screen unfocused, app backgrounded, or Reduce Motion). */
  paused: boolean;
  variant: FieldVariantName;
  scheme: ColorScheme;
}

export default function FieldCanvas({ width, height, paused, variant, scheme }: FieldCanvasProps) {
  const time = useSharedValue(0);
  const initial = variantToArray(FIELD_VARIANTS[variant], scheme);
  const from = useSharedValue<number[]>(initial);
  const to = useSharedValue<number[]>(initial);
  const progress = useSharedValue(1);

  useEffect(() => {
    // Start the fade from wherever the previous fade currently is.
    const current = from.value.map((v, i) => v + (to.value[i] - v) * progress.value);
    from.value = current;
    to.value = variantToArray(FIELD_VARIANTS[variant], scheme);
    progress.value = 0;
    progress.value = withTiming(1, { duration: VARIANT_FADE_MS, easing: Easing.inOut(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, scheme]);

  useFrameCallback((frame) => {
    const stepS = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, MAX_FRAME_STEP_S);
    time.value += stepS * DRIFT_SPEED * 10;
  }, !paused);

  const uniforms = useDerivedValue(() => {
    const p = progress.value;
    const v = from.value.map((x, i) => x + (to.value[i] - x) * p);
    return {
      size: [width, height],
      t: time.value,
      blue: [v[0], v[1], v[2]],
      violet: [v[3], v[4], v[5]],
      levelsU: v[6],
      glowU: v[7],
      widthU: v[8],
      intensityU: v[9],
      washU: v[10],
      baseU: [v[11], v[12], v[13]],
    };
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <Shader source={SOURCE} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

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
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.03 + float2(17.1, 9.2);
    amp *= 0.5;
  }
  return v;
}

half4 main(float2 xy) {
  float2 uv = xy / size.y;
  float2 p = uv * 2.4 + float2(t * 0.020, -t * 0.014);
  float h = height(p) + 0.15 * sin(uv.x * 2.4 + t * 0.05);

  // Screen-space distance to the nearest contour: divide by the height
  // gradient so lines stay hairline-thin on steep and flat ground alike.
  float e = 0.01;
  float2 grad = float2(height(p + float2(e, 0.0)) - height(p - float2(e, 0.0)),
                       height(p + float2(0.0, e)) - height(p - float2(0.0, e))) / (2.0 * e);
  float levels = 11.0;
  float d = abs(fract(h * levels) - 0.5) / levels / max(length(grad) * 2.4, 0.02);
  float line = 1.0 - smoothstep(0.0012, 0.0042, d);
  float glow = 1.0 - smoothstep(0.004, 0.03, d);

  float mixer = clamp(0.5 + 0.9 * sin(uv.x * 1.6 + uv.y * 1.3 - t * 0.05), 0.0, 1.0);
  float3 tint = mix(blue, violet, mixer);

  float fade = 1.0 - smoothstep(0.30, 1.0, xy.y / size.y);
  fade = 0.18 + 0.82 * fade;

  float3 base = float3(0.027, 0.027, 0.043);
  float3 color = base + tint * (line * 0.55 + glow * 0.07) * fade;
  return half4(half3(color), 1.0);
}
`)!;

interface FieldCanvasProps {
  width: number;
  height: number;
  /** True stops the clock (screen unfocused, app backgrounded, or Reduce Motion). */
  paused: boolean;
}

export default function FieldCanvas({ width, height, paused }: FieldCanvasProps) {
  const time = useSharedValue(0);

  useFrameCallback((frame) => {
    const stepS = Math.min((frame.timeSincePreviousFrame ?? 0) / 1000, MAX_FRAME_STEP_S);
    time.value += stepS * DRIFT_SPEED * 10;
  }, !paused);

  const uniforms = useDerivedValue(() => ({
    size: [width, height],
    t: time.value,
    blue: [0.18, 0.42, 1.0],
    violet: [0.54, 0.36, 1.0],
  }));

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <Shader source={SOURCE} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

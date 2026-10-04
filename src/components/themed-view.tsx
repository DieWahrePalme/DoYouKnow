import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  // Untyped views stay transparent so the animated field shows through; pass `type` for a solid surface.
  return <View style={[type ? { backgroundColor: theme[type] } : null, style]} {...otherProps} />;
}

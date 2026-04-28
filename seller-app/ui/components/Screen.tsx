import type { PropsWithChildren } from 'react';
import { SafeAreaView, View, type ViewProps } from 'react-native';
import { theme } from '../theme';

export function Screen({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View {...rest} style={[{ flex: 1, padding: theme.spacing.md }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}


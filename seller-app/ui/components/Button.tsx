import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { theme } from '../theme';
import { Text } from './Text';

type Variant = 'primary' | 'ghost' | 'danger';

type Props = PressableProps & {
  variant?: Variant;
  title?: string;
};

export function Button({ variant = 'primary', title, children, style, disabled, ...rest }: PropsWithChildren<Props>) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.98 : 1, { duration: 120 }) }],
  }));

  const colors = (() => {
    if (variant === 'danger') {
      return {
        bg: 'rgba(239,68,68,0.12)',
        border: 'rgba(239,68,68,0.32)',
        text: theme.colors.danger,
      };
    }
    if (variant === 'ghost') {
      return {
        bg: '#FFFFFF',
        border: theme.colors.border,
        text: theme.colors.text,
      };
    }
    return {
      bg: theme.colors.primary,
      border: 'rgba(18,101,214,0.35)',
      text: '#FFFFFF',
    };
  })();

  return (
    <Animated.View style={[animatedStyle, { opacity: disabled ? 0.6 : 1 }, style]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={(e) => {
          pressed.value = 1;
          rest.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          pressed.value = 0;
          rest.onPressOut?.(e);
        }}
        style={{
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadow.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {typeof title === 'string' ? (
            <Text variant="h2" weight="extrabold" style={{ color: colors.text }}>
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </Pressable>
    </Animated.View>
  );
}


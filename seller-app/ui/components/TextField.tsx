import { TextInput, View, type TextInputProps } from 'react-native';
import { theme } from '../theme';
import { Text } from './Text';

export function TextField({
  label,
  style,
  inputStyle,
  ...rest
}: TextInputProps & {
  label: string;
  inputStyle?: TextInputProps['style'];
}) {
  return (
    <View style={[{ gap: 6 }, style as any]}>
      <Text variant="muted" weight="bold">
        {label}
      </Text>
      <TextInput
        {...rest}
        placeholderTextColor="rgba(106,122,149,0.9)"
        style={[
          {
            color: theme.colors.text,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: '#FFFFFF',
          },
          inputStyle as any,
        ]}
      />
    </View>
  );
}


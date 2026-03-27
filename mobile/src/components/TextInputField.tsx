/**
 * TextInputField — A themed text input for the AURA app.
 *
 * Uses NativeWind (className) for layout & color styling.
 * Uses inline styles only for props not supported by NativeWind
 * (placeholderTextColor, selectionColor, cursorColor).
 */

import React from 'react';
import { TextInput, View } from 'react-native';
import type { TextInputFieldProps } from '../types/components';

const TextInputField: React.FC<TextInputFieldProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  autoCapitalize = 'none',
  style,
}) => {
  return (
    <View className="w-full" style={style}>
      <TextInput
        className="w-full bg-surface border border-aura-border rounded-aura-md px-aura-md py-aura-md text-aura-md text-aura-text"
        placeholder={placeholder}
        placeholderTextColor="#8B8A93"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        selectionColor="#A78BFA"
        cursorColor="#7C5CFC"
      />
    </View>
  );
};

export default TextInputField;

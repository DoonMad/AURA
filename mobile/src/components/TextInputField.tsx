/**
 * TextInputField — A themed text input for the AURA app.
 *
 * Uses NativeWind (className) for layout & color styling.
 */

import React, { useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full" style={style}>
      <TextInput
        className={`w-full bg-surface-light border ${
          isFocused ? 'border-primary' : 'border-aura-border'
        } rounded-aura-md px-aura-md py-aura-md text-aura-md text-aura-text`}
        placeholder={placeholder}
        placeholderTextColor="#71717A"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        selectionColor="#F4F4F5"
        cursorColor="#F4F4F5"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export default TextInputField;

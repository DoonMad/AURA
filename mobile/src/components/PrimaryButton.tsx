/**
 * PrimaryButton — A themed action button for the AURA app.
 *
 * Supports two variants:
 *   • "filled"  — solid primary background (default)
 *   • "outline" — transparent with a primary border
 *
 * Uses NativeWind (className) for styling.
 */

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import type { PrimaryButtonProps } from '../types';

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  disabled = false,
  style,
}) => {
  const isFilled = variant === 'filled';

  const baseClass = 'w-full py-aura-md rounded-aura-md items-center justify-center';
  const variantClass = isFilled
    ? 'bg-primary'
    : 'bg-transparent border border-primary';
  const disabledClass = disabled ? 'opacity-50' : '';

  const labelBase = 'text-aura-md font-bold uppercase tracking-widest';
  const labelColor = isFilled ? 'text-background' : 'text-primary';

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClass} ${disabledClass}`}
      style={style}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text className={`${labelBase} ${labelColor}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;

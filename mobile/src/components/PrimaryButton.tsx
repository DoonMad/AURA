/**
 * PrimaryButton — A themed action button for the AURA app.
 *
 * Supports two variants:
 *   • "filled"  — solid purple background (default)
 *   • "outline" — transparent with a purple border
 *
 * Uses NativeWind (className) for styling.
 * Uses inline style only for letterSpacing (not supported by NativeWind).
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
    : 'bg-transparent border-[1.5px] border-primary';
  const disabledClass = disabled ? 'opacity-45' : '';

  const labelBase = 'text-aura-md font-semibold';
  const labelColor = isFilled ? 'text-white' : 'text-primary-light';
  const labelDisabled = disabled ? 'text-aura-muted' : '';

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClass} ${disabledClass}`}
      style={style}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <Text
        className={`${labelBase} ${labelColor} ${labelDisabled}`}
        style={{ letterSpacing: 0.4 }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;

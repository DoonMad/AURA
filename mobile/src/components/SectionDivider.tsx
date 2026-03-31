/**
 * SectionDivider — A horizontal divider with an optional centred label.
 *
 * Uses NativeWind (className) for styling.
 * Uses inline style only for letterSpacing (not supported by NativeWind).
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { SectionDividerProps } from '../types';

const SectionDivider: React.FC<SectionDividerProps> = ({ label, style }) => {
  return (
    <View className="flex-row items-center w-full py-aura-sm" style={style}>
      <View className="flex-1 h-px bg-aura-border" />
      {label ? (
        <Text
          className="mx-aura-md text-aura-sm text-aura-muted font-medium uppercase"
          style={{ letterSpacing: 1 }}
        >
          {label}
        </Text>
      ) : null}
      <View className="flex-1 h-px bg-aura-border" />
    </View>
  );
};

export default SectionDivider;

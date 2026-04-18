/**
 * SectionDivider — A horizontal divider with an optional centred label.
 *
 * Uses NativeWind (className) for styling.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { SectionDividerProps } from '../types';

const SectionDivider: React.FC<SectionDividerProps> = ({ label, style }) => {
  return (
    <View className="flex-row items-center w-full py-aura-lg" style={style}>
      <View className="flex-1 h-px bg-aura-border" />
      {label ? (
        <Text className="mx-aura-md text-aura-xs text-aura-muted font-bold uppercase tracking-[2px]">
          {label}
        </Text>
      ) : null}
      <View className="flex-1 h-px bg-aura-border" />
    </View>
  );
};

export default SectionDivider;

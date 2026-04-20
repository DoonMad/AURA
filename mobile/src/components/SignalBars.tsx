import React from 'react';
import { View } from 'react-native';

export type SignalLevel = 0 | 1 | 2 | 3 | 4;

type Props = {
  level: SignalLevel;
};

const BAR_HEIGHTS = [6, 10, 14, 18];

const levelColor = (level: SignalLevel): string => {
  if (level >= 4) return '#22C55E'; // green
  if (level === 3) return '#22C55E'; // green
  if (level === 2) return '#EAB308'; // yellow
  if (level === 1) return '#EF4444'; // red
  return '#3F3F46'; // muted/off
};

const SignalBars: React.FC<Props> = ({ level }) => {
  const color = levelColor(level);

  return (
    <View className="flex-row items-end space-x-[2px] h-[18px]">
      {BAR_HEIGHTS.map((height, i) => {
        const isActive = level > 0 && i < level;
        return (
          <View
            key={i}
            style={{
              width: 3,
              height,
              borderRadius: 1.5,
              backgroundColor: isActive ? color : '#27272A',
            }}
          />
        );
      })}
    </View>
  );
};

export default SignalBars;

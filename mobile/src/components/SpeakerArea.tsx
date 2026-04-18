import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import type { SpeakerAreaProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const SpeakerArea: React.FC<SpeakerAreaProps> = ({ speakerName, isActive = false }) => {
  // Determine if someone is actively speaking
  const isSpeaking = isActive && speakerName !== undefined;
  
  // Text display logic
  const displayName = speakerName || 'Standing by...';
  const displayLabel = isSpeaking ? 'Speaking' : 'Stand by';

  // Dynamic styling based on activity
  const iconColor = isSpeaking ? '#22C55E' : '#71717A'; // Active: Green, Idle: Muted

  // Animation Refs
  const anim1 = useRef(new Animated.Value(0.3)).current;
  const anim2 = useRef(new Animated.Value(0.3)).current;
  const anim3 = useRef(new Animated.Value(0.3)).current;
  const anim4 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isSpeaking) {
      const createAnimation = (anim: Animated.Value, delay: number, duration: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: duration,
              delay: delay,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: duration,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const anims = [
        createAnimation(anim1, 0, 300),
        createAnimation(anim2, 100, 350),
        createAnimation(anim3, 200, 250),
        createAnimation(anim4, 150, 400),
      ];

      anims.forEach(a => a.start());

      return () => {
        anims.forEach(a => a.stop());
        anim1.setValue(0.3);
        anim2.setValue(0.3);
        anim3.setValue(0.3);
        anim4.setValue(0.3);
      };
    } else {
      Animated.timing(anim1, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
      Animated.timing(anim2, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
      Animated.timing(anim3, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
      Animated.timing(anim4, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
    }
  }, [isSpeaking, anim1, anim2, anim3, anim4]);

  return (
    <View className="w-full max-w-[340px] bg-surface-lighter border border-aura-border px-5 py-3 rounded-full flex-row items-center shadow-lg">
      
      {/* Activity Indicator / Icon */}
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mr-4 border ${
          isSpeaking ? 'bg-aura-active/10 border-aura-active/50' : 'bg-surface border-aura-border'
        }`}
        style={isSpeaking ? styles.speakingGlow : undefined}
      >
        <Icon name={isSpeaking ? "radio" : "minus"} size={18} color={iconColor} />
      </View>
      
      {/* Speaker Identity */}
      <View className="mr-4 flex-1">
        <Text className={`text-[10px] uppercase tracking-[3px] font-bold ${isSpeaking ? 'text-aura-active' : 'text-aura-muted'}`}>
          {displayLabel}
        </Text>
        <Text 
          className={`text-lg font-black tracking-wide mt-0.5 ${isSpeaking ? 'text-white' : 'text-aura-text'}`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>
      </View>

      {/* Dynamic/Static Sound Waves */}
      <View className="flex-row items-end space-x-1 h-8 w-14 justify-center">
        <Animated.View style={[styles.wave, { height: anim1.interpolate({ inputRange: [0, 1], outputRange: ['20%', '100%'] }), backgroundColor: isSpeaking ? '#22C55E' : '#27272A' }]} />
        <Animated.View style={[styles.wave, { height: anim2.interpolate({ inputRange: [0, 1], outputRange: ['20%', '80%'] }), backgroundColor: isSpeaking ? '#22C55E' : '#27272A' }]} />
        <Animated.View style={[styles.wave, { height: anim3.interpolate({ inputRange: [0, 1], outputRange: ['20%', '100%'] }), backgroundColor: isSpeaking ? '#22C55E' : '#27272A' }]} />
        <Animated.View style={[styles.wave, { height: anim4.interpolate({ inputRange: [0, 1], outputRange: ['20%', '60%'] }), backgroundColor: isSpeaking ? '#22C55E' : '#27272A' }]} />
      </View>
      
    </View>
  )
}

const styles = StyleSheet.create({
  speakingGlow: {
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  wave: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  }
})

export default SpeakerArea

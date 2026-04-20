import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export type ActivityToastItem = {
  id: string;
  message: string;
  type: 'join' | 'leave';
};

type Props = {
  toasts: ActivityToastItem[];
  onExpire: (id: string) => void;
};

const TOAST_DURATION = 3000;

const SingleToast: React.FC<{ toast: ActivityToastItem; onExpire: () => void }> = ({ toast, onExpire }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => onExpire());
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const isJoin = toast.type === 'join';

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
      className={`mx-6 mb-2 rounded-xl border px-4 py-2.5 flex-row items-center ${
        isJoin
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-zinc-500/10 border-zinc-500/20'
      }`}
    >
      <View
        className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
          isJoin ? 'bg-emerald-500/20' : 'bg-zinc-500/20'
        }`}
      >
        <Icon
          name={isJoin ? 'user-plus' : 'user-minus'}
          size={12}
          color={isJoin ? '#34D399' : '#A1A1AA'}
        />
      </View>
      <Text
        className={`text-xs font-bold tracking-wide flex-1 ${
          isJoin ? 'text-emerald-200' : 'text-zinc-400'
        }`}
        numberOfLines={1}
      >
        {toast.message}
      </Text>
    </Animated.View>
  );
};

const ActivityToast: React.FC<Props> = ({ toasts, onExpire }) => {
  if (toasts.length === 0) return null;

  return (
    <View className="z-40">
      {toasts.map((t) => (
        <SingleToast key={t.id} toast={t} onExpire={() => onExpire(t.id)} />
      ))}
    </View>
  );
};

export default ActivityToast;

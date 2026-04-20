import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { AppNotice } from '../store/useAppStore';

type SystemBannerProps = {
  notice: AppNotice;
  onDismiss?: () => void;
};

const toneClasses: Record<AppNotice['tone'], { wrapper: string; title: string; text: string }> = {
  info: {
    wrapper: 'bg-surface-lighter border-aura-border',
    title: 'text-primary',
    text: 'text-aura-text',
  },
  success: {
    wrapper: 'bg-emerald-500/10 border-emerald-500/30',
    title: 'text-emerald-300',
    text: 'text-emerald-100',
  },
  warning: {
    wrapper: 'bg-amber-500/10 border-amber-500/30',
    title: 'text-amber-300',
    text: 'text-amber-100',
  },
  error: {
    wrapper: 'bg-red-500/10 border-red-500/30',
    title: 'text-red-300',
    text: 'text-red-100',
  },
};

const SystemBanner: React.FC<SystemBannerProps> = ({ notice, onDismiss }) => {
  const classes = toneClasses[notice.tone];

  return (
    <View className={`mx-6 mb-4 rounded-2xl border px-4 py-3 ${classes.wrapper}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className={`text-sm font-black uppercase tracking-[2px] ${classes.title}`}>
            {notice.title}
          </Text>
          <Text className={`mt-1 text-sm ${classes.text}`}>
            {notice.message}
          </Text>
        </View>

        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} className="px-2 py-1">
            <Text className={`text-xs font-bold uppercase tracking-[2px] ${classes.title}`}>
              Dismiss
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SystemBanner;

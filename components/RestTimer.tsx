import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Schwebende Pausenuhr für das Training. Läuft rückwärts, vibriert am Ende
 * (auf dem iPhone) und lässt sich um ±15 s anpassen.
 */
export function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const fired = useRef(false);

  // Bei neuem Start (geänderte Sekunden) zurücksetzen
  useEffect(() => {
    setRemaining(seconds);
    setRunning(true);
    fired.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!fired.current) {
            fired.current = true;
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
          }
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const done = remaining === 0;

  return (
    <View style={[styles.bar, done && styles.barDone]}>
      <FontAwesome name={done ? 'check' : 'clock-o'} size={16} color={done ? '#0d0d12' : colors.accent} />
      <Text style={[styles.time, done && styles.timeDone]}>
        {done ? 'Pause vorbei!' : `Pause ${fmt(remaining)}`}
      </Text>
      {!done && (
        <>
          <Pressable style={styles.adjust} onPress={() => setRemaining((r) => Math.max(5, r - 15))} hitSlop={6}>
            <Text style={styles.adjustText}>−15</Text>
          </Pressable>
          <Pressable style={styles.adjust} onPress={() => setRemaining((r) => r + 15)} hitSlop={6}>
            <Text style={styles.adjustText}>+15</Text>
          </Pressable>
        </>
      )}
      <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
        <FontAwesome name="times" size={16} color={done ? '#0d0d12' : colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  barDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  time: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  timeDone: { color: '#0d0d12' },
  adjust: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adjustText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  close: { paddingLeft: 4 },
});

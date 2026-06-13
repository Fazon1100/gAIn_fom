import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/theme';
import { useDb } from '../context/DbProvider';
import * as repo from '../lib/data/repository';

/**
 * Einstiegspunkt: leitet zum Onboarding (Erststart) oder direkt ins Training.
 */
export default function Index() {
  const { db } = useDb();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    repo
      .getSetting(db, 'onboarding_done')
      .then((v) => setTarget(v === '1' ? '/(tabs)/train' : '/onboarding'));
  }, [db]);

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={target} />;
}

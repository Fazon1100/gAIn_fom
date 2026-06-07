import * as SQLite from 'expo-sqlite';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { migrate } from '../lib/data/db';

type DbState = {
  db: SQLite.SQLiteDatabase | null;
  ready: boolean;
  error: Error | null;
  refreshToken: number;
  refresh: () => void;
};

const DbContext = createContext<DbState>({
  db: null,
  ready: false,
  error: null,
  refreshToken: 0,
  refresh: () => {},
});

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useMemo(
    () => () => setRefreshToken((t) => t + 1),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const database = await SQLite.openDatabaseAsync('gain.db');
        await migrate(database);
        if (!cancelled) {
          setDb(database);
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Datenbankfehler</Text>
        <Text style={styles.errMsg}>{error.message}</Text>
      </View>
    );
  }

  if (!ready || !db) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7ee787" />
        <Text style={styles.loading}>gAIn wird geladen …</Text>
      </View>
    );
  }

  return (
    <DbContext.Provider value={{ db, ready, error, refreshToken, refresh }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  return useContext(DbContext);
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0d0d12',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loading: { color: '#9ca3af', marginTop: 12 },
  errTitle: { color: '#f87171', fontSize: 18, fontWeight: '600' },
  errMsg: { color: '#d1d5db', marginTop: 8, textAlign: 'center' },
});

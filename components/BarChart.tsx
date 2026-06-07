import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export type BarDatum = {
  label: string;
  value: number;
  sub?: string;
  color?: string;
};

function abbreviate(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return `${Math.round(n)}`;
}

/**
 * Schlankes Balkendiagramm ohne externe Abhängigkeiten – funktioniert auf
 * iOS, Android und Web. Höhe der Balken proportional zum größten Wert.
 */
export function BarChart({
  data,
  height = 120,
  accent = colors.accent,
  format = abbreviate,
  scrollable = false,
}: {
  data: BarDatum[];
  height?: number;
  accent?: string;
  format?: (n: number) => string;
  scrollable?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  const bars = (
    <View style={styles.row}>
      {data.map((d, i) => {
        const h = d.value > 0 ? Math.max(4, Math.round((d.value / max) * height)) : 0;
        return (
          <View key={i} style={[styles.col, scrollable && styles.colFixed]}>
            <Text style={styles.val} numberOfLines={1}>
              {d.value > 0 ? format(d.value) : ''}
            </Text>
            <View style={[styles.track, { height }]}>
              <View style={[styles.bar, { height: h, backgroundColor: d.color ?? accent }]} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
            {d.sub ? (
              <Text style={styles.sub} numberOfLines={1}>
                {d.sub}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {bars}
      </ScrollView>
    );
  }
  return bars;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, alignItems: 'center' },
  colFixed: { width: 54, flex: undefined },
  val: { color: colors.muted, fontSize: 10, marginBottom: 4, fontWeight: '600' },
  track: { width: '70%', justifyContent: 'flex-end', minWidth: 14 },
  bar: { width: '100%', borderRadius: 5, minHeight: 0 },
  label: { color: colors.text, fontSize: 11, marginTop: 6, fontWeight: '500' },
  sub: { color: colors.muted, fontSize: 9, marginTop: 1 },
});

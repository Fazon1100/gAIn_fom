import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

/**
 * Fängt unerwartete Render-Fehler ab und zeigt statt eines weißen Absturzes
 * einen freundlichen Hinweis. Erhöht die Stabilität für den produktiven Einsatz.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }

  componentDidCatch(error: unknown) {
    // Für die Entwicklung in der Konsole protokollieren.
    console.error('[gAIn] ErrorBoundary:', error);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>😵‍💫</Text>
        <Text style={styles.title}>Etwas ist schiefgelaufen</Text>
        <Text style={styles.text}>
          Ein unerwarteter Fehler ist aufgetreten. Du kannst es erneut versuchen – deine Daten sind
          sicher gespeichert.
        </Text>
        <Pressable style={styles.button} onPress={this.reset} accessibilityRole="button">
          <Text style={styles.buttonText}>Erneut versuchen</Text>
        </Pressable>
        {__DEV__ && <Text style={styles.detail}>{this.state.message}</Text>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: 12,
  },
  emoji: { fontSize: 44 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  text: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: spacing.sm,
  },
  buttonText: { color: '#0d0d12', fontSize: 16, fontWeight: '800' },
  detail: { color: colors.danger, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
});

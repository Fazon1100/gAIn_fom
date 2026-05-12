import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Seite nicht gefunden</Text>
      <PrimaryButton
        title="Zur Startseite"
        onPress={() => router.replace('/(tabs)/train')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: colors.text, fontSize: 18, marginBottom: 20 },
});

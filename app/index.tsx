import { Redirect } from 'expo-router';

/** Root `/` → erstes Tab (Train). Ohne diese Datei führt `/` zu +not-found. */
export default function Index() {
  return <Redirect href="/(tabs)/train" />;
}

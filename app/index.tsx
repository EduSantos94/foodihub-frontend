import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/theme';

/**
 * Entry route ("/"): sends the user to the dashboard or to the login. A <Redirect> works on the phone
 * too, where navigating from an effect before the router is ready is ignored.
 */
export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={token ? '/(app)/dashboard' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});

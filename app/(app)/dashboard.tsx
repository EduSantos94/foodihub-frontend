import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface Store {
  id: string;
  name: string;
  email: string;
  city: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut, token } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/stores?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStores(response.data.data || []);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao carregar lojas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const renderStoreItem = ({ item }: { item: Store }) => (
    <View style={styles.storeCard}>
      <Text style={styles.storeName}>{item.name}</Text>
      <Text style={styles.storeEmail}>{item.email}</Text>
      <Text style={styles.storeCity}>{item.city}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bem-vindo! 👋</Text>
          <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stores.length}</Text>
          <Text style={styles.statLabel}>Lojas</Text>
        </View>
      </View>

      {/* Stores List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Suas Lojas</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchStores} style={styles.retryButton}>
              <Text style={styles.retryText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {stores.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma loja encontrada</Text>
          </View>
        ) : (
          <FlatList
            data={stores}
            renderItem={renderStoreItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={stores.length === 0 ? {} : { gap: 12 }}
          />
        )}
      </View>

      {/* API Status */}
      <View style={styles.apiStatus}>
        <Text style={styles.apiStatusText}>
          ✅ Conectado em {process.env.EXPO_PUBLIC_API_URL}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#c33',
    fontWeight: '600',
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  section: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeEmail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  storeCity: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#c33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  apiStatus: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  apiStatusText: {
    fontSize: 12,
    color: '#0099cc',
    fontWeight: '600',
  },
});

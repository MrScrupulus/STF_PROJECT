import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../services/adminService';
import { formatDateTime } from '../utils/dateUtils';
import Header from '../components/Header';

export default function AdminCatchValidationListScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [catchesPage, setCatchesPage] = useState(1);
  const [catchesPages, setCatchesPages] = useState(1);
  const [allCatches, setAllCatches] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Charger la première page
  const { data: pendingCatchesData, isLoading: loadingCatches } = useQuery({
    queryKey: ['admin-pending-catches', catchesPage],
    queryFn: () => adminService.getPendingCatches(catchesPage, 10),
  });

  // Mettre à jour les prises
  useEffect(() => {
    if (pendingCatchesData) {
      if (catchesPage === 1) {
        setAllCatches(pendingCatchesData.catches || []);
      } else {
        setAllCatches(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNew = (pendingCatchesData.catches || []).filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNew];
        });
        setIsLoadingMore(false);
      }
      setCatchesPages(pendingCatchesData.pages || 1);
    }
  }, [pendingCatchesData, catchesPage]);

  const loadMoreCatches = () => {
    if (catchesPage < catchesPages && !isLoadingMore) {
      setIsLoadingMore(true);
      setCatchesPage(prev => prev + 1);
    }
  };

  const validateMutation = useMutation({
    mutationFn: (catchId: number) => adminService.validateCatch(catchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-catches'] });
      Alert.alert('Succès', 'Prise validée avec succès.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la validation. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleValidate = (catchId: number) => {
    Alert.alert(
      'Valider la prise',
      'Êtes-vous sûr de vouloir valider cette prise ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: () => validateMutation.mutate(catchId),
        },
      ]
    );
  };

  const handleReject = (catchId: number) => {
    // Naviguer vers AdminCatchValidation dans le Stack Navigator parent
    const parent = navigation.getParent();
    if (parent) {
      (parent as any).navigate('AdminCatchValidation', { catchId, action: 'reject' });
    } else {
      (navigation as any).navigate('AdminCatchValidation', { catchId, action: 'reject' });
    }
  };

  const handleViewCatch = (catchId: number) => {
    // Naviguer vers AdminCatchValidation dans le Stack Navigator parent
    const parent = navigation.getParent();
    if (parent) {
      (parent as any).navigate('AdminCatchValidation', { catchId, action: 'view' });
    } else {
      (navigation as any).navigate('AdminCatchValidation', { catchId, action: 'view' });
    }
  };

  if (loadingCatches && catchesPage === 1) {
    return (
      <>
        <Header title="Validation de prises" showBack={false} showMenu={true}  />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  const pendingCount = pendingCatchesData?.total || allCatches.length;

  return (
    <>
      <Header title="Validation de prises" showBack={false} showMenu={true}  />
      <View style={styles.container}>
        {pendingCount === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune prise en attente</Text>
            <Text style={styles.emptySubtext}>
              Toutes les prises ont été validées ou rejetées.
            </Text>
          </View>
        ) : (
          <FlatList
            data={allCatches}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={({ item: catchItem }: any) => (
              <TouchableOpacity
                style={styles.catchCard}
                onPress={() => handleViewCatch(catchItem.id)}
                activeOpacity={0.7}
              >
                <View style={styles.catchHeader}>
                  <Text style={styles.catchTitle}>
                    {catchItem.species?.name || 'Espèce inconnue'}
                  </Text>
                  <Text style={styles.catchSize}>{catchItem.size} cm</Text>
                </View>
                <Text style={styles.catchTeam}>
                  Équipe: {catchItem.team?.name || 'N/A'}
                </Text>
                {catchItem.caughtBy && (
                  <Text style={styles.catchMember}>
                    Pêché par: {catchItem.caughtBy.firstname} {catchItem.caughtBy.lastname}
                  </Text>
                )}
                <Text style={styles.catchDate}>
                  {formatDateTime(catchItem.createdAt)}
                </Text>
                <View style={styles.catchActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.validateButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleValidate(catchItem.id);
                    }}
                    disabled={validateMutation.isPending}
                  >
                    <Text style={styles.actionButtonText}>✓ Valider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReject(catchItem.id);
                    }}
                    disabled={validateMutation.isPending}
                  >
                    <Text style={styles.actionButtonText}>✗ Rejeter</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            onEndReached={loadMoreCatches}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingMoreText}>Chargement...</Text>
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  catchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  catchSize: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  catchTeam: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  catchMember: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  catchDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  catchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  validateButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
});

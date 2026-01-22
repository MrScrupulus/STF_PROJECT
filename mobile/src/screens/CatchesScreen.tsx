import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { catchesService } from '../services/catchesService';
import { formatDateTime } from '../utils/dateUtils';
import Header from '../components/Header';

export default function CatchesScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['catches'],
    queryFn: async () => {
      try {
        const result = await catchesService.getAll();
        console.log('Catches data received:', result); // Debug
        return result;
      } catch (err) {
        console.error('Error fetching catches:', err); // Debug
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur lors du chargement</Text>
      </View>
    );
  }

  const renderCatch = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.species.name}</Text>
        <Text style={styles.cardPoints}>{item.points} pts</Text>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.cardInfo}>Longueur: {item.length || item.size} cm</Text>
        <Text style={styles.cardInfo}>
          Équipe: {item.team.name}
        </Text>
        {item.competition && (
          <Text style={styles.cardInfo}>
            Compétition: {item.competition.name}
          </Text>
        )}
        {item.createdAt && (
          <Text style={styles.cardInfo}>
            Date: {formatDateTime(item.createdAt)}
          </Text>
        )}
        {item.comment && (
          <Text style={styles.cardComment}>{item.comment}</Text>
        )}
      </View>
      {item.photoUrl && (
        <TouchableOpacity
          style={styles.cardPhoto}
          onPress={() => setSelectedImage(item.photoUrl)}
        >
          <Image
            source={{ uri: item.photoUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
      <View style={[
        styles.cardStatus,
        item.isValidated ? styles.cardStatusValidated : styles.cardStatusPending
      ]}>
        <Text style={styles.cardStatusText}>
          {item.isValidated ? '✅ Validé' : '⏳ En attente'}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Header title="Mes Prises" showBack={true} showMenu={true} />
      <View style={styles.container}>
        <FlatList
          data={data || []}
          renderItem={renderCatch}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Aucune prise enregistrée</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez votre première prise pour commencer à marquer des points !
              </Text>
            </View>
          }
        />
      </View>

      {/* Modal pour agrandir la photo */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  cardDetails: {
    marginBottom: 12,
  },
  cardInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  cardPhoto: {
    marginTop: 8,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  cardStatus: {
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  cardStatusValidated: {
    backgroundColor: '#d4edda',
  },
  cardStatusPending: {
    backgroundColor: '#fff3cd',
  },
  cardStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
});


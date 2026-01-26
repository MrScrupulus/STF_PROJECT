import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Header from '../components/Header';

export default function LegalNoticeScreen() {
  return (
    <View style={styles.container}>
      <Header title="Mentions légales" showBack={true} showMenu={true} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Mentions légales</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Éditeur du site</Text>
          <Text style={styles.text}>
            Street Fishing est une application mobile développée pour la gestion de compétitions de pêche urbaine.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Hébergement</Text>
          <Text style={styles.text}>
            Les données sont hébergées sur des serveurs sécurisés conformément aux normes de protection des données.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Protection des données personnelles</Text>
          <Text style={styles.text}>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, 
            de rectification, de suppression et d'opposition aux données personnelles vous concernant.
          </Text>
          <Text style={styles.text}>
            Pour exercer ces droits, vous pouvez contacter l'administrateur via votre profil dans l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Propriété intellectuelle</Text>
          <Text style={styles.text}>
            L'ensemble du contenu de cette application (textes, images, logos, icônes) est la propriété exclusive 
            de Street Fishing, sauf mention contraire.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Responsabilité</Text>
          <Text style={styles.text}>
            Street Fishing s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées. 
            Cependant, l'application ne peut garantir l'exactitude, la complétude et l'actualité des informations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cookies</Text>
          <Text style={styles.text}>
            L'application utilise des technologies de stockage local pour améliorer l'expérience utilisateur 
            et mémoriser vos préférences.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Contact</Text>
          <Text style={styles.text}>
            Pour toute question concernant ces mentions légales, vous pouvez nous contacter via l'application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.lastUpdated}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

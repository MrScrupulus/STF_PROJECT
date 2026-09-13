import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Pressable,
} from 'react-native';
import Header from '../components/Header';

export default function LegalNoticeScreen() {
  return (
    <View style={styles.container}>
      <Header title="Mentions légales" showBack={true} showMenu={true} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Mentions légales</Text>
        <Text style={styles.intro}>
          Informations sur l’éditeur, la confidentialité, les conditions d’utilisation
          et le contact. Version web : https://scrupy.com/legal/privacy
        </Text>

        <Text style={styles.partTitle}>A. Éditeur et hébergement</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Éditeur</Text>
          <Text style={styles.text}>
            Street Fishing est une application de gestion de compétitions de pêche urbaine
            (street fishing).
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hébergement</Text>
          <Text style={styles.text}>
            L’application et l’API sont hébergées sur nos serveurs (scrupy.com /
            api.scrupy.com), avec accès en HTTPS.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
          <Text style={styles.text}>
            Textes, images, logos et icônes de l’application sont la propriété de Street
            Fishing, sauf mention contraire.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsabilité</Text>
          <Text style={styles.text}>
            Nous visons l’exactitude des informations (classements, prises, règlements).
            L’application ne peut toutefois garantir l’exhaustivité ni l’actualité permanente
            de toutes les données affichées.
          </Text>
        </View>

        <Text style={styles.partTitle}>B. Politique de confidentialité</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données collectées</Text>
          <Text style={styles.text}>• Compte : nom, prénom, e-mail, mot de passe (haché), éventuellement téléphone et date de naissance.</Text>
          <Text style={styles.text}>• Usage : équipes, inscriptions aux compétitions, prises (espèce, taille, photo, commentaire).</Text>
          <Text style={styles.text}>• Localisation : pendant une compétition, pour vérifier que la prise est dans la zone autorisée (permission sur l’appareil).</Text>
          <Text style={styles.text}>• Photos : stockées sur nos serveurs ; enregistrement possible dans la galerie si vous l’autorisez.</Text>
          <Text style={styles.text}>• Notifications : jeton de l’appareil si vous acceptez les notifications.</Text>
          <Text style={styles.text}>• Stockage local : préférences de l’application sur l’appareil.</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisation</Text>
          <Text style={styles.text}>
            Compte, compétitions, scores, classements, e-mails de service (confirmation,
            mot de passe, invitations). Pas de vente de données à des tiers.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos droits (RGPD)</Text>
          <Text style={styles.text}>
            Accès, rectification, suppression et opposition. Pour les exercer : profil dans
            l’application, ou e-mail ci-dessous.
          </Text>
        </View>

        <Text style={styles.partTitle}>C. Conditions d’utilisation</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objet</Text>
          <Text style={styles.text}>
            Ces conditions régissent l’usage de Street Fishing (application et site) pour
            participer aux compétitions et consulter les classements.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <Text style={styles.text}>Fournir des informations exactes et respecter le règlement de chaque compétition.</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participation</Text>
          <Text style={styles.text}>Respecter les zones et horaires autorisés, le barème, et l’esprit sportif.</Text>
        </View>

        <Text style={styles.partTitle}>D. Contact</Text>
        <View style={styles.section}>
          <Pressable onPress={() => Linking.openURL('mailto:noreply@scrupy.com')}>
            <Text style={styles.link}>noreply@scrupy.com</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://scrupy.com/contact')}>
            <Text style={styles.link}>https://scrupy.com/contact</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://scrupy.com/legal/privacy')}>
            <Text style={styles.link}>Politique de confidentialité (web)</Text>
          </Pressable>
        </View>

        <Text style={styles.lastUpdated}>
          Dernière mise à jour : 13 septembre 2026
        </Text>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  intro: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  partTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginTop: 8,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 8,
  },
  link: {
    fontSize: 15,
    color: '#007AFF',
    lineHeight: 24,
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  lastUpdated: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

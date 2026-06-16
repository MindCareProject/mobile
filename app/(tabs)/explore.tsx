import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_PROFILE_URL = "https://staging-api.duckdns.org/api/mobile/profile/";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);

  // État complet pour le patient
  const [patientInfo, setPatientInfo] = useState({
    firstName: "Chargement...",
    lastName: "",
    email: "...",
    phone: "...",
    dob: "...",
    address: "...",
  });

  const [psyInfo, setPsyInfo] = useState({
    name: "Chargement...",
    cabinet: "Chargement...",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const localName = await SecureStore.getItemAsync('firstName');
      if (localName) setPatientInfo(prev => ({ ...prev, firstName: localName }));

      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(API_PROFILE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Formatage de la date (de YYYY-MM-DD à DD/MM/YYYY)
        let formattedDob = "Non renseignée";
        if (data.date_of_birth) {
          const dateObj = new Date(data.date_of_birth);
          formattedDob = dateObj.toLocaleDateString('fr-FR');
        }

        setPatientInfo({
          firstName: data.first_name || "Non renseigné",
          lastName: data.last_name || "",
          email: data.email || "Non renseigné",
          phone: data.phone || "Non renseigné",
          dob: formattedDob,
          address: data.address || "Non renseignée",
        });

        setPsyInfo({
          name: data.psy_name,
          cabinet: data.psy_cabinet,
        });
      } else {
        console.log("Erreur de récupération du profil :", response.status);
      }
    } catch (error) {
      console.log("Erreur réseau profil :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter de votre espace sécurisé ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Me déconnecter", 
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('token');
              await SecureStore.deleteItemAsync('firstName');
              router.replace('/login');
            } catch (error) {
              console.log("Erreur de déconnexion", error);
            }
          }
        }
      ]
    );
  };

  const getInitials = () => {
    const f = patientInfo.firstName.charAt(0).toUpperCase();
    const l = patientInfo.lastName.charAt(0).toUpperCase();
    return `${f}${l}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Espace</Text>
        <Text style={styles.subtitle}>Gérez vos informations personnelles</Text>
      </View>

      {/* SECTION PATIENT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes informations</Text>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nom complet</Text>
            {loading ? <ActivityIndicator size="small" color="#0ea5e9" /> : <Text style={styles.value}>{patientInfo.firstName} {patientInfo.lastName}</Text>}
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date de naissance</Text>
            {loading ? <ActivityIndicator size="small" color="#0ea5e9" /> : <Text style={styles.value}>{patientInfo.dob}</Text>}
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            {loading ? <ActivityIndicator size="small" color="#0ea5e9" /> : <Text style={styles.value}>{patientInfo.email}</Text>}
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Téléphone</Text>
            {loading ? <ActivityIndicator size="small" color="#0ea5e9" /> : <Text style={styles.value}>{patientInfo.phone}</Text>}
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRowColumn}>
            <Text style={styles.label}>Adresse</Text>
            {loading ? <ActivityIndicator size="small" color="#0ea5e9" style={{marginTop: 5}}/> : <Text style={styles.valueMulti}>{patientInfo.address}</Text>}
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Statut du dossier</Text>
            <View style={styles.badgeActive}>
              <Text style={styles.badgeTextActive}>Actif et Sécurisé</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SECTION PSYCHOLOGUE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon Thérapeute</Text>
        <View style={styles.card}>
          <View style={styles.psyHeader}>
            <View style={styles.psyAvatar}>
              <Text style={styles.psyAvatarText}>⚕️</Text>
            </View>
            <View>
              {loading ? (
                <ActivityIndicator size="small" color="#0ea5e9" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <>
                  <Text style={styles.psyName}>{psyInfo.name}</Text>
                  <Text style={styles.psyCabinet}>{psyInfo.cabinet}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.securityNotice}>
            🔒 Vos échanges avec ce professionnel sont chiffrés de bout en bout. Seul votre thérapeute possède la clé pour lire vos réponses.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutButtonText}>Fermer ma session</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>MindCare Patient v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4, fontWeight: '500' },
  section: { marginTop: 30, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#0ea5e9' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoRowColumn: { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 8 }, // Nouveau style pour l'adresse longue
  label: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 16, color: '#0f172a', fontWeight: '600' },
  valueMulti: { fontSize: 16, color: '#0f172a', fontWeight: '600', marginTop: 4, lineHeight: 22 }, // Pour l'adresse sur plusieurs lignes
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  badgeActive: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  badgeTextActive: { color: '#166534', fontSize: 12, fontWeight: '700' },
  psyHeader: { flexDirection: 'row', alignItems: 'center' },
  psyAvatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  psyAvatarText: { fontSize: 24 },
  psyName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  psyCabinet: { fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 2 },
  securityNotice: { fontSize: 13, color: '#64748b', lineHeight: 20, fontStyle: 'italic', marginTop: 4 },
  logoutButton: { marginHorizontal: 24, marginTop: 40, backgroundColor: '#fee2e2', padding: 16, borderRadius: 16, alignItems: 'center' },
  logoutButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  versionText: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginTop: 20, marginBottom: 40 }
});
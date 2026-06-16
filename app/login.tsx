import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRouter, Stack } from 'expo-router'; 
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://staging-api.duckdns.org/api'; 

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Erreur", "Merci de remplir les deux champs.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login/`, { 
        username: username,
        password: password
      });

      // SAUVEGARDE CHIFFRÉE DE NIVEAU MILITAIRE
      await SecureStore.setItemAsync('token', response.data.access);
      await SecureStore.setItemAsync('firstName', response.data.first_name || "Patient");

      Alert.alert("Bienvenue !", `Bonjour ${response.data.first_name || "Patient"} !`, [
        { text: "C'est parti", onPress: () => router.replace('/(tabs)') }
      ]);

    } catch (error) {
      console.log("Erreur :", error);
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert("Échec", "Identifiant ou mot de passe incorrect.");
      } else {
        Alert.alert("Erreur Réseau", "Impossible de joindre le serveur. Vérifie ton IP !");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🛑 LA LIGNE MAGIQUE POUR CACHER L'EN-TÊTE EST ICI 🛑 */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.card}>
        <Text style={styles.title}>MindCare Patient</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>

        <TextInput
          style={styles.input}
          placeholder="Email ou Nom d'utilisateur"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', backgroundColor: 'white', padding: 30, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0369a1', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1' },
  button: { backgroundColor: '#0ea5e9', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
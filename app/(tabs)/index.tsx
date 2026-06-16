import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, FlatList, 
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, 
  Platform, RefreshControl 
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = "https://staging-api.duckdns.org/api/mobile/journal/";

// Interface pour TypeScript
interface Question {
  id: number;
  date: string;
  ai_question: string;
  is_answered: boolean;
  answered_at: string | null;
}

export default function HomeScreen() {
  const [patientName, setPatientName] = useState('Patient');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      const name = await SecureStore.getItemAsync('firstName');
      if (name) setPatientName(name);
      await fetchQuestions();
    } catch (e) {
      console.log("Erreur INIT :", e);
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        console.log("Erreur serveur :", response.status);
      }
    } catch (error) {
      console.log("Erreur réseau :", error);
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  };

  // FONCTION DÉCLENCHÉE QUAND ON TIRE L'ÉCRAN VERS LE BAS
  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const submitAnswer = async (questionId: number) => {
    const answerText = answers[questionId];
    if (!answerText || answerText.trim() === "") {
      Alert.alert("Oups", "Veuillez écrire une réponse avant de l'envoyer.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_URL}${questionId}/answer/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: answerText }),
      });

      if (response.ok) {
        Alert.alert("Superbe", "Votre réponse a été transmise en toute sécurité à votre thérapeute.");
        fetchQuestions(); 
      } else {
        Alert.alert("Erreur", "Impossible d'envoyer la réponse.");
      }
    } catch (error) {
      Alert.alert("Erreur réseau", "Vérifiez votre connexion internet.");
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('firstName');
      router.replace('/login');
    } catch (error) {
      console.log("Erreur de déconnexion", error);
    }
  };

  const renderQuestionCard = ({ item }: { item: Question }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateBadge}>{item.date}</Text>
        <Text style={styles.doctorLabel}>De votre thérapeute</Text>
      </View>
      
      <Text style={styles.questionText}>{item.ai_question}</Text>
      
      {item.is_answered ? (
        <View style={styles.successBadge}>
          <Text style={styles.successText}>Réflexion envoyée le {item.answered_at?.substring(0, 10)}</Text>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Prenez le temps de répondre ici..."
            placeholderTextColor="#94a3b8"
            multiline
            value={answers[item.id] || ""}
            onChangeText={(text) => setAnswers({ ...answers, [item.id]: text })}
          />
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={() => submitAnswer(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Envoyer au cabinet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>{patientName}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Synchronisation sécurisée...</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderQuestionCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0ea5e9"
              colors={["#0ea5e9"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Tout est à jour</Text>
              <Text style={styles.emptyText}>
                Vous n'avez aucun nouvel exercice en attente.{'\n'}
                Tirez l'écran vers le bas pour vérifier.
              </Text>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

// DESIGN SYSTEM MINDCARE PATIENT
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24, 
    paddingTop: 70,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  greeting: { 
    fontSize: 16, 
    color: '#64748b',
    fontWeight: '500',
  },
  name: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#0f172a',
    marginTop: 2,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20, 
    // Ombres douces type iOS
    shadowColor: "#94a3b8", 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBadge: { 
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12, 
    color: '#475569',
    fontWeight: '600',
  },
  doctorLabel: {
    fontSize: 12,
    color: '#0ea5e9', // Bleu MindCare
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  questionText: { 
    fontSize: 18, 
    color: '#1e293b', 
    fontWeight: '600', 
    lineHeight: 28,
    marginBottom: 20, 
  },
  inputContainer: {
    marginTop: 10,
  },
  textInput: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16, 
    padding: 16, 
    fontSize: 16, 
    minHeight: 120, 
    textAlignVertical: 'top', 
    color: '#334155',
    lineHeight: 24,
  },
  submitButton: { 
    backgroundColor: '#0ea5e9', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 16,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16,
    letterSpacing: 0.5,
  },
  successBadge: { 
    backgroundColor: '#f0fdf4', 
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    marginTop: 10,
  },
  successText: { 
    color: '#166534', 
    fontWeight: '700', 
    fontSize: 14 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#64748b', 
    fontSize: 15,
    lineHeight: 22,
  }
});
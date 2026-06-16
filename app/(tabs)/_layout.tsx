import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function TabLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          router.replace('/login');
          return;
        }
      } catch (error) {
        console.error("Erreur de vérification du token", error);
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkToken();
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9', 
        tabBarInactiveTintColor: '#94a3b8', 
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 0, 
          shadowOpacity: 0, // Enlève l'ombre sur iOS
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Exercices', 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Mon Espace',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size + 4} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}
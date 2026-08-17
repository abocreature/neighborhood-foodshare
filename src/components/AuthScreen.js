import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Platform, Alert } from 'react-native';
import { supabase } from '../services/supabase';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    // If testing in Chrome/Safari browser, use standard web alerts
    alert(`${title}: ${message}`);
  } else {
    // If testing on your physical phone via Expo Go, use native alerts
    Alert.alert(title, message);
  }
};

export default function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up with custom metadata passed into our trigger
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        showAlert('Success', 'Account created! Please log in.');
        setIsSignUp(false);
      } else {
        // Log In
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess(data.user);
      }
    } catch (err) {
      showAlert('Authentication Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome to Foodshare'}</Text>
      
      {isSignUp && (
        <TextInput 
          placeholder="Full Name" 
          value={fullName} 
          onChangeText={setFullName} 
          style={styles.input} 
        />
      )}
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        style={styles.input} 
      />
      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={styles.input} 
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchButton}>
        <Text style={styles.switchText}>
          {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 6, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#0066cc', padding: 15, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 15, alignItems: 'center' },
  switchText: { color: '#0066cc', fontSize: 14 }
});
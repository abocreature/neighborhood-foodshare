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
    if (!email || !password) return showAlert('Error', 'Please fill in all fields');
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
      <View style={styles.card}>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Neighborhood Foodshare'}</Text>
        
        {isSignUp && (
          <TextInput 
            placeholder="Full Name" 
            value={fullName} 
            onChangeText={setFullName} 
            style={styles.input} 
          />
        )}
        <TextInput 
          placeholder="Email Address" 
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

        <TouchableOpacity style={styles.button} onPress={() => handleAuth()} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Syncing...' : isSignUp ? 'Register Account' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchButton}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Sign In' : 'New to Foodshare? Register Here'}
          </Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <View style={styles.devPanel}>
          <Text style={styles.devTitle}>🛠️ DEV ENVIRONMENT BYPASS AUTOMATION</Text>
          <View style={styles.devRow}>
            
            <TouchableOpacity 
              style={[styles.devButton, { backgroundColor: '#2563eb' }]} 
              onPress={async () => {
                setLoading(true);
                try {
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: 'chef@test.com',
                    password: 'password123'
                  });
                  if (error) throw error;
                  onAuthSuccess(data.user);
                } catch (err) {
                  showAlert('Dev Bypass Fault', err.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.devButtonText}>⚡ Login as Dad (Chef)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.devButton, { backgroundColor: '#16a34a' }]} 
              onPress={async () => {
                setLoading(true);
                try {
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: 'neighbor@test.com',
                    password: 'password123'
                  });
                  if (error) throw error;
                  onAuthSuccess(data.user);
                } catch (err) {
                  showAlert('Dev Bypass Fault', err.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.devButtonText}>⚡ Login as Neighbor</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: '#f8fafc', minHeight: '100vh' },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', padding: 25, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1e293b' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 6, marginBottom: 15, fontSize: 15, backgroundColor: '#fff' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  switchButton: { marginTop: 15, alignItems: 'center' },
  switchText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  
  devPanel: { 
    width: '100%', 
    maxWidth: 400, 
    marginTop: 25, 
    padding: 15, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    borderStyle: 'dashed', 
    alignItems: 'center',
    zIndex: 999,      // <-- Forces the dev bypass module to render on TOP of background components
    elevation: 5      // <-- Force android layout stacking order layer separation
  },
  devTitle: { fontSize: 10, fontWeight: 'bold', color: '#475569', letterSpacing: 0.5, marginBottom: 10 },
    devRow: { 
    flexDirection: 'row', 
    gap: 10, 
    width: '100%', 
    justifyContent: 'center',
    marginTop: 10     // Provide separation margin padding
  },
  devButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, flex: 1, alignItems: 'center' },
  devButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
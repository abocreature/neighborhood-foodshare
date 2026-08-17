import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Button } from 'react-native';
import CustomerMenu from './src/components/CustomerMenu';
import AdminDashboard from './src/components/AdminDashboard';
import AuthScreen from './src/components/AuthScreen';
import { supabase } from './src/services/supabase';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [currentView, setCurrentView] = useState('customer');

  useEffect(() => {
    // Check initial session state on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
    });

    // Listen to changes in auth states automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!sessionUser) {
    return <AuthScreen onAuthSuccess={(user) => setSessionUser(user)} />;
  }

  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10 }}>
        <Button title="Menu" onPress={() => setCurrentView('customer')} />
        <Button title="Admin" onPress={() => setCurrentView('admin')} />
        <Button title="Log Out" onPress={() => supabase.auth.signOut()} color="red" />
      </View>
      {currentView === 'customer' ? <CustomerMenu user={sessionUser} /> : <AdminDashboard />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#222' },
  statusText: { fontSize: 16, color: '#555', textAlign: 'center' },
});
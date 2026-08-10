import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import CustomerMenu from './src/components/CustomerMenu';
import AdminDashboard from './src/components/AdminDashboard';
import { supabase } from './src/services/supabase';

export default function App() {
  // Options: 'customer' or 'admin'
  const [currentView, setCurrentView] = useState('customer');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState ('Testing database connection...');

  useEffect(() => {
    async function testConnection() {
      try {
        // Run a simple query to fetch just 1 row from your meals table
        const { data, error } = await supabase.from('meals').select('*').limit(1);
        
        if (error) throw error;
        
        setConnectionStatus('Success! Connected securely to Supabase.');
      } catch (err) {
        setConnectionStatus(`Connection Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neighborhood Foodshare</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : (
        <Text style={styles.statusText}>{connectionStatus}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#222' },
  statusText: { fontSize: 16, color: '#555', textAlign: 'center' },
});
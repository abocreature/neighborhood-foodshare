import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import CustomerMenu from './src/components/CustomerMenu';
import AdminDashboard from './src/components/AdminDashboard';
import { supabase } from './src/services/supabase';

export default function App() {
  // Options: 'customer' or 'admin'
  const [currentView, setCurrentView] = useState('customer');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      {/* Global Navigation Bar */}
      <nav style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
        <button 
          onClick={() => setCurrentView('customer')}
          style={{ marginRight: '10px', fontWeight: currentView === 'customer' ? 'bold' : 'normal' }}
        >
          Weekly Menu
        </button>
        <button 
          onClick={() => setCurrentView('admin')}
          style={{ fontWeight: currentView === 'admin' ? 'bold' : 'normal' }}
        >
          Admin Dashboard
        </button>
      </nav>

      {/* Conditional Rendering Logic */}
      <main>
        {currentView === 'customer' && <CustomerMenu />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#222' },
  statusText: { fontSize: 16, color: '#555', textAlign: 'center' },
});
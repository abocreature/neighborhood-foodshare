import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Button } from 'react-native';
import CustomerMenu from './src/components/CustomerMenu';
import AdminDashboard from './src/components/AdminDashboard';
import AuthScreen from './src/components/AuthScreen';
import { supabase } from './src/services/supabase';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [resolvingRole, setResolvingRole] = useState(false);

  const fetchUserRole = async (userId) => {
    setResolvingRole(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data) setUserRole(data.role);
    } catch (err) {
      console.error('Failed to resolve authenticated role context:', err.message);
    } finally {
      setResolvingRole(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setSessionUser(user);
      if (user) fetchUserRole(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSessionUser(user);
      if (user) fetchUserRole(user.id);
      else setUserRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!sessionUser) {
    return <AuthScreen onAuthSuccess={(user) => setSessionUser(user)} />;
  }

  if (resolvingRole) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Resolving User Space Access...</Text>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <View style={styles.appMaxWidthBox}>
        
        <View style={styles.navHeaderCard}>
          <Text style={styles.userEmailText}>
            Logged in as: <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{sessionUser.email}</Text> ({userRole?.toUpperCase()})
          </Text>
          <Button title="Log Out" onPress={() => supabase.auth.signOut()} color="#ef4444" />
        </View>

        <View style={{ flex: 1 }}>
          {userRole === 'chef' ? (
            <AdminDashboard user={sessionUser} />
          ) : (
            <CustomerMenu user={sessionUser} />
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', paddingTop: 40 },
  appMaxWidthBox: { width: '100%', maxWidth: 600, flex: 1, paddingHorizontal: 15 },
  navHeaderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userEmailText: { fontSize: 13, color: '#64748b' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }
});
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Text, View, ActivityIndicator, Button } from 'react-native';
import CustomerMenu from './src/components/CustomerMenu';
import AdminDashboard from './src/components/AdminDashboard';
import AuthScreen from './src/components/AuthScreen';
import ProfilePage from './src/components/ProfilePage';
import { supabase } from './src/services/supabase';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [resolvingRole, setResolvingRole] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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
    <ScrollView 
      contentContainerStyle={styles.rootScrollViewContainer}
      showsVerticalScrollIndicator={true}
      bounces={false}
    >
      <View style={styles.rootContainer} documentTitle={`Stan's Pantry`}>
        <View style={styles.appMaxWidthBox}>
          <Text style={{ 
          fontSize: 28, 
          fontWeight: '900', 
          color: '#1e293b', 
          textAlign: 'center', 
          marginBottom: 5,
          letterSpacing: -0.5
        }}>
          Stan's Pantry
        </Text>
        
        <Text style={{
          fontSize: 13,
          fontWeight: '500',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: 20,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Barnardsville, NC • Local Foodshare
        </Text>
          <View style={styles.navHeaderCard}>
            <Text style={styles.userEmailText}>
              Logged in as: <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{sessionUser.email}</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {userRole === 'neighbor' && !showProfile && (
                <Button title="My Account" onPress={() => setShowProfile(true)} color="#2563eb" />
              )}
              <Button title="Log Out" onPress={() => supabase.auth.signOut()} color="#ef4444" />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            {userRole === 'chef' ? (
              <AdminDashboard user={sessionUser} />
            ) : showProfile ? (
              <ProfilePage user={sessionUser} onClose={() => setShowProfile(false)} />
            ) : (
              <CustomerMenu user={sessionUser} />
            )}
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rootScrollViewContainer: { 
    flexGrow: 1, 
    backgroundColor: '#f8fafc', 
    alignItems: 'center', 
    paddingTop: 30,
    paddingBottom: 40,
    width: '100%',
    overflowX: 'hidden'
  },
  appMaxWidthBox: { 
    width: '100%', 
    maxWidth: 500,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  brandTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 4, letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  navHeaderCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  userEmailText: { fontSize: 13, color: '#64748b', marginBottom: 12, textAlign: 'center', width: '100%' },
  buttonRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  
  viewContentWrapper: { width: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }
});
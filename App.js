import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Text, View, ActivityIndicator, Button, ImageBackground, TouchableOpacity } from 'react-native';
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
    return (
      <ImageBackground
        source={require('./assets/fall_background.jpg')}
        style={styles.backgroundImageContainer}
        resizeMode="cover"
        documentTitle={`Stan's Pantry`}
      >
        <AuthScreen onAuthSuccess={(user) => setSessionUser(user)} />
      </ImageBackground>
    );
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
    <ImageBackground
      source={require('./assets/fall_background.jpg')}
      style={styles.backgroundImageContainer}
      resizeMode="cover"
    >
      <ScrollView 
        contentContainerStyle={styles.rootScrollViewContainer}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        <View style={styles.mainContentCenterWindow} documentTitle={`Stan's Pantry`}>
          <View style={styles.appMaxWidthBox}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: '700', 
              color: '#fef2f2', 
              textAlign: 'center', 
              marginBottom: 5,
              letterSpacing: -0.5
            }}>
              Stan's Pantry
            </Text>
          
            <Text style={{
              fontSize: 13,
              fontWeight: '500',
              color: '#cbd5e1',
              textAlign: 'center',
              marginBottom: 20,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Barnardsville, NC • Local Foodshare
            </Text>
            <View style={styles.navHeaderCard}>
              <Text style={styles.userEmailText}>
                Logged in as: <Text style={{ fontWeight: '600', color: '#f97316' }}>{sessionUser.email}</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {userRole === 'neighbor' && !showProfile && (
                  <Button title="My Account" onPress={() => setShowProfile(true)} color='#f97316' />
                )}
                <Button title="Log Out" onPress={() => supabase.auth.signOut()} color='#f94316' />
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  rootScrollViewContainer: { 
    flexGrow: 1, 
    backgroundColor: 'transparent', 
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
  mainContentCenterWindow: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(19, 13, 8, 0.81)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.29)',
    padding: 24,
    alignItems: 'center',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
    marginHorizontal: 16
  },

  brandTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#271a13', 
    textAlign: 'center', 
    marginBottom: 4, 
    letterSpacing: -0.5 
  },
  brandSubtitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#64748b', 
    textAlign: 'center', 
    marginBottom: 20, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  
  navHeaderCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 20
  },
  userEmailText: { 
    fontSize: 13, 
    color: '#cbd5e1',
    marginBottom: 12, 
    textAlign: 'center', 
    width: '100%' 
  },
  buttonRow: { 
    flexDirection: 'row', 
    gap: 12, 
    justifyContent: 'center', 
    flexWrap: 'wrap' 
  },
  
  viewContentWrapper: { 
    width: '100%' 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)' 
  }
});
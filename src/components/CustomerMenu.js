import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, TextInput } from 'react-native';
import { supabase } from '../services/supabase'

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    // If testing in Chrome/Safari browser, use standard web alerts
    alert(`${title}: ${message}`);
  } else {
    // If testing on your physical phone via Expo Go, use native alerts
    Alert.alert(title, message);
  }
};

export default function CustomerMenu({ user }) {
  const [meals, setMeals] = useState([]);
  const [profileName, setProfileName] = useState('Neighbor');
  const [loading, setLoading] = useState(true);
  const [processingID, setProcessingID] = useState(null);
  const [activeClaims, setActiveClaims] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        // Fetching profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError; 
        if (profileData) setProfileName(profileData.full_name);

        // Fetching upcoming meals
        const { data: mealData, error: mealError } = await supabase
          .from('meals')
          .select('*')
          .order('serving_date', { ascending: false });

        if (mealError) throw mealError;

        // Fetch existing orders
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, meal_id, portions_requested, status')
          .eq('neighbor_id', user.id)
          .eq('status', 'pending');
        if (orderError) throw orderError;

        const claimsMap = {};
        (orderData || []).forEach(order => {
          claimsMap[order.meal_id] = {
            orderID: order.id,
            portions: order.portions_requested
          };
        });
        
        setMeals(mealData || []);
        setActiveClaims(claimsMap);
      } catch (err) {
        console.error('Data loading error: ', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleInitialClaim = async (mealID) => {
    if (processingID) return;
    setProcessingID(mealID);

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          meal_id: mealID,
          neighbor_id: user.id,
          portions_requested: 1,
          status: 'pending'
        }])
        .select('id')
        .single();

        if (error) throw error;

        setActiveClaims(prev => ({
          ...prev,
          [mealID]: { orderID: data.id, portions: 1 }
        }));
    } catch (err) {
      console.error('Initial claim transaction failed:', err.message);
    } finally {
      setProcessingID(null);
    }
  };

  const handleUpdatePortions = async (mealID, currentOrderID, newAmount) => {
    if (newAmount < 1 || processingID) return;
    setProcessingID(mealID);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ portions_requested: newAmount })
        .eq('id', currentOrderID);

      if (error) throw error;

      setActiveClaims(prev => ({
        ...prev,
        [mealID]: { ...prev[mealID], portions: newAmount }
      }));
    } catch (err) {
      console.error('Portion adjustment failed:', err.message);
    } finally {
      setProcessingID(null);
    }
  };

  const handleCancelClaim = async (mealID, currentOrderID) => {
    if (processingID) return;
    setProcessingID(mealID);

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', currentOrderID);

      if (error) throw error;

      setActiveClaims(prev => {
        const updated = { ...prev };
        delete updated[mealID];
        return updated;
      });
    } catch (err) {
      console.error('Order cancellation failed:', err.message);
    } finally {
      setProcessingID(null);
    }
  };

  const formatCardDate = (dateString) => {
    const options = { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome back, {profileName}!</Text>
      <Text style={styles.subHeader}>Tap any dinner menu card to claim your portion delivery:</Text>

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const claim = activeClaims[item.id];
          const isClaimed = !!claim;

          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.card, isClaimed && styles.claimedCard]}
              onPress={() => !isClaimed && handleInitialClaim(item.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.dateText, isClaimed && styles.claimedDateText]}>
                  {formatCardDate(item.serving_date)}
                </Text>
                {isClaimed && (
                  <TouchableOpacity 
                    style={styles.cancelX} 
                    onPress={() => handleCancelClaim(item.id, claim.orderID)}
                  >
                    <Text style={styles.cancelXText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.dishName}>{item.dish_name}</Text>
              <Text style={styles.description}>{item.description}</Text>

              {/* Dynamic Overlay Layout: Pops up only inside claimed items */}
              {isClaimed && (
                <View style={styles.portionsOverlay} onStartShouldSetResponder={() => true}>
                  <Text style={styles.portionsLabel}>Your Order:</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity 
                      style={styles.arrowButton} 
                      onPress={() => handleUpdatePortions(item.id, claim.orderID, claim.portions - 1)}
                      disabled={claim.portions <= 1}
                    >
                      <Text style={[styles.arrowText, claim.portions <= 1 && styles.disabledText]}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.portionCount}>{claim.portions}</Text>

                    <TouchableOpacity 
                      style={styles.arrowButton} 
                      onPress={() => handleUpdatePortions(item.id, claim.orderID, claim.portions + 1)}
                    >
                      <Text style={styles.arrowText}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.unitText}>Dinner(s) Secured</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff', alignItems: 'center' },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  subHeader: { fontSize: 14, color: '#666', marginBottom: 15, marginTop: 4, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center' },
  
  // Basic Card Styling
  card: { padding: 18, backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, maxWidth: 600 },
  claimedCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 13, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  claimedDateText: { color: '#16a34a' },
  
  dishName: { fontSize: 19, fontWeight: 'bold', color: '#1e293b', marginVertical: 6, textAlign: 'center' },
  description: { fontSize: 14, color: '#64748b', marginBottom: 12, lineHeight: 20, textAlign: 'center' },
  
  // Custom Controls Overlay
  portionsOverlay: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#dcfce7', flexDirection: 'column', alignItems: 'center' },
  portionsLabel: { fontSize: 12, fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase', marginBottom: 6 },
  counterRow: { flexDirection: 'row', alignItems: 'center', textAlign: 'center' },
  arrowButton: { width: 36, height: 36, backgroundColor: '#fff', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  portionCount: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
  unitText: { fontSize: 14, color: '#16a34a', fontWeight: '500', marginLeft: 10 },
  disabledText: { color: '#cbd5e1' },
  
  cancelX: { position: 'absolute', right: -50, width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelXText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' }
});
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function CustomerMenu({ user }) {
  const [meals, setMeals] = useState([]);
  const [profileName, setProfileName] = useState('Neighbor');
  const [loading, setLoading] = useState(true);
  const [processingID, setProcessingID] = useState(null);
  const [errorText, setErrorText] = useState('');
  const [activeClaims, setActiveClaims] = useState({});
  const [successText, setSuccessText] = useState({});

  const triggerSavedFlash = (mealID) => {
    setSuccessText(prev => ({ ...prev, [mealID]: true }));
    setTimeout(() => {
      setSuccessText(prev => ({ ...prev, [mealID]: false }));
    }, 1500); //1.5 seconds
  };

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
        const todayString = new Date().toISOString().split('T')[0];
        const { data: mealData, error: mealError } = await supabase
          .from('meals')
          .select('*')
          .gte('serving_date', todayString)
          .order('serving_date', { ascending: false });

        if (mealError) throw mealError;

        // Fetch existing orders
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, meal_id, portions_requested, status')
          .eq('neighbor_id', user.id)
          .in('status', ['pending', 'confirmed']);
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
        setErrorText(`System synchronization error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const handleInitialClaim = async (mealID) => {
    if (processingID) return;
    setProcessingID(mealID);
    setErrorText('');

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

        triggerSavedFlash(mealID);

    } catch (err) {
      setErrorText(`Initial claim failed: ${err.message}`);
    } finally {
      setProcessingID(null);
    }
  };

  const handleUpdatePortions = async (mealID, currentOrderID, newAmount) => {
    if (newAmount < 1 || processingID) return;
    setProcessingID(mealID);
    setErrorText('');

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

        triggerSavedFlash(mealID);

    } catch (err) {
      setErrorText(`Portion adjustment failed: ${err.message}`);
    } finally {
      setProcessingID(null);
    }
  };

  const handleCancelClaim = async (mealID, currentOrderID) => {
    if (processingID) return;
    setProcessingID(mealID);
    setErrorText('');

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

        triggerSavedFlash(mealID);

    } catch (err) {
      setErrorText(`Order cancellation failed: ${err.message}`);
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
      <Text style={styles.subHeader}>Tap any dinner menu card to claim your delivery:</Text>

      {errorText ? <Text style={styles.errorInlineText}>{errorText}</Text> : null}

      {meals.map((item) => {
          const claim = activeClaims[item.id];
          const isClaimed = !!claim;
          const isSaved = !!successText[item.id];

          return (
            <TouchableOpacity 
              key={item.id}
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
                  <View style={styles.overlayHeaderRow}>
                    <Text style={styles.portionsLabel}>Your Order:</Text>
                    {isSaved && <Text style={styles.savedFlash}> • Saved!</Text>}
                  </View>
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
                    <Text style={styles.unitText}>Portion(s)</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  subHeader: { fontSize: 14, color: '#666', marginBottom: 15, marginTop: 4, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center' },

  errorInlineText: { color: '#ef4444', backgroundColor: '#fef2f2', padding: 10, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: '#ef4444', fontSize: 14, fontWeight: '500', marginBottom: 15, width: '100%', textAlign: 'center' },
  
  // Basic Card Styling
  container: { width: '100%' },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  subHeader: { fontSize: 14, color: '#666', marginBottom: 20, marginTop: 4, textAlign: 'center' },
  centered: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  
  errorInlineText: { color: '#ef4444', backgroundColor: '#fef2f2', padding: 10, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: '#ef4444', fontSize: 14, fontWeight: '500', marginBottom: 15, width: '100%', textAlign: 'center' },

  card: { width: '100%', padding: 18, backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  claimedCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  cardHeader: { flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 4 },
  dateText: { fontSize: 13, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 },
  claimedDateText: { color: '#16a34a' },
  dishName: { fontSize: 19, fontWeight: 'bold', color: '#1e293b', marginVertical: 6, textAlign: 'center' },
  description: { fontSize: 14, color: '#64748b', marginBottom: 12, lineHeight: 20, textAlign: 'center' },
  
  portionsOverlay: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#dcfce7', flexDirection: 'column', alignItems: 'center', width: '100%' },
  overlayHeaderRow: { flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  portionsLabel: { fontSize: 12, fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase' },
  savedFlash: { fontSize: 12, fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.5 },

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  arrowButton: { width: 36, height: 36, backgroundColor: '#fff', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  portionCount: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
  unitText: { fontSize: 14, color: '#16a34a', fontWeight: '500', marginLeft: 10 },
  disabledText: { color: '#cbd5e1' },
  
  cancelX: { position: 'absolute', right: 0, width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelXText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444', marginTop: -1 },
});
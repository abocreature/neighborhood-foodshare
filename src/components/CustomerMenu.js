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
  const [claimingID, setClaimingID] = useState(null);
  const [selectedPortions, setSelectedPortions] = useState({});

  useEffect(() => {
    async function fetchMeals() {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError; 
        if (profileData) setProfileName(profileData.full_name);

        const { data: mealData, error: mealError } = await supabase
          .from('meals')
          .select('*')
          .order('serving_date', { ascending: true });

        if (mealError) throw mealError;
        setMeals(mealData || []);

        const initialPortions = {};
        (mealData || []).forEach(meal => {
          initialPortions[meal.id] = 1;
        });
        setSelectedPortions(initialPortions);

      } catch (err) {
        console.error('Data loading error: ', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMeals();
  }, [user]);

  const handlePortionChange = (mealID, value) => {
    const parsed = parseInt(value, 10);
    const count = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setSelectedPortions({
      ...selectedPortions,
      [mealID]: count
    });
  };

  const handleClaimMeal = async (mealID) => {
    setClaimingID(mealID);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            meal_id: mealID,
            neighbor_id: user.id,
            portions_requested: 1,
            status: 'pending'
          }
        ]);

        if (error) throw error;

        const alertMsg = "Your dinner choice has been logged!";
        showAlert("Success", alertMsg);
    } catch (err) {
      console.error('Error creating order:', err.message);
    } finally {
      setClaimingID(null);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome back, {profileName}!</Text>
      <Text style={styles.subHeader}>Select how many dinner portions you would like to claim:</Text>
      
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.date}>{new Date(item.serving_date).toLocaleDateString()}</Text>
              <Text style={styles.dishName}>{item.dish_name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.portionsText}>Available Batch Portions: {item.total_portions}</Text>
            </View>

            {/* Quantity Selector Layer Row */}
            <View style={styles.quantityRow}>
              <Text style={styles.label}>Portions Needed:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(selectedPortions[item.id] || 1)}
                onChangeText={(val) => handlePortionChange(item.id, val)}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => handleClaimMeal(item.id)}
              disabled={claimingID === item.id}
            >
              <Text style={styles.buttonText}>
                {claimingID === item.id ? 'Processing...' : `Claim ${selectedPortions[item.id] || 1} Dinner(s)`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  subHeader: { fontSize: 14, color: '#666', marginBottom: 20, marginTop: 4 },
  card: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  cardContent: { marginBottom: 10 },
  date: { fontSize: 12, fontWeight: 'bold', color: '#0066cc' },
  dishName: { fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  description: { fontSize: 14, color: '#555', marginBottom: 6 },
  portionsText: { fontSize: 12, color: '#888', fontWeight: '500' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 5 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginRight: 10 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', width: 45, textAlign: 'center', fontSize: 16, paddingVertical: 2, fontWeight: 'bold' },
  button: { backgroundColor: '#34a853', padding: 12, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  centered: { flex: 1, justifyContent: 'center' }
});
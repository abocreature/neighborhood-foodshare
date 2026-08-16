import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase'

export default function CustomerMenu() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeals() {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .order('serving_date', { ascending: true });

        if (error) throw error;
        setMeals(data || []);
      } catch (err) {
        console.error('Error fetching meals: ', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMeals();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upcoming Menu</Text>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{new Date(item.serving_date).toLocaleDateString()}</Text>
            <Text style={styles.dishName}>{item.dish_name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.portions}>Portions Left: {item.total_portions}</Text>
                
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Claim Dinner</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  date: { fontSize: 12, fontWeight: 'bold', color: '#0066cc' },
  dishName: { fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  description: { fontSize: 14, color: '#666', marginBottom: 8 },
  portions: { fontSize: 13, color: '#888', marginBottom: 10 },
  button: { backgroundColor: '#0066cc', padding: 10, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center' }
});
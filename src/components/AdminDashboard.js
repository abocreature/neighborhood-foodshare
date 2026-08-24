import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State Layout
  const [showForm, setShowForm] = useState(false);
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [servingDate, setServingDate] = useState(''); // Expected format: YYYY-MM-DD
  const [totalPortions, setTotalPortions] = useState('10'); // Default placeholder default count

  useEffect(() => {
    async function fetchMasterManifest() {
      try {
        // SQL Join: Fetch orders data alongside related meal and profile info
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            portions_requested,
            status,
            meals ( dish_name, serving_date ),
            profiles ( full_name, address )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching manifest:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMasterManifest();
  }, []);

  // Form Submit Handler: Writes a new row to the 'meals' table
  const handleCreateMeal = async () => {
    if (!dishName || !servingDate) {
      alert('Error: Dish Name and Serving Date are strictly required.');
      return;
    }
    
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('meals')
        .insert([
          {
            dish_name: dishName,
            description: description,
            serving_date: servingDate,
            total_portions: parseInt(totalPortions, 10) || 0,
            chef_id: (await supabase.auth.getUser()).data.user?.id // Dynamically links your dad's auth account ID
          }
        ]);

      if (error) throw error;

      alert('Success! New meal posted to the weekly menu.');
      
      // Clear form inputs and reset view state
      setDishName('');
      setDescription('');
      setServingDate('');
      setShowForm(false);
      
    } catch (err) {
      alert(`Database Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dad's Chef Admin Panel</Text>
      <Text style={styles.subHeader}>Track delivery schedules and post upcoming menus.</Text>
      
      {/* Form Toggle Button */}
      <TouchableOpacity 
        style={[styles.toggleButton, showForm && styles.cancelToggleButton]} 
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.toggleButtonText}>{showForm ? '✕ Close Form' : '+ Post New Meal'}</Text>
      </TouchableOpacity>

      {/* Dynamic Input Form Segment Layout */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Menu Item Configurations</Text>
          
          <TextInput
            placeholder="Dish Name (e.g., Rosemary Baked Chicken)"
            value={dishName}
            onChangeText={setDishName}
            style={styles.input}
          />
          <TextInput
            placeholder="Description (e.g., Served with a side of potatoes)"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.textArea]}
          />
          <TextInput
            placeholder="Serving Date (YYYY-MM-DD format)"
            value={servingDate}
            onChangeText={setServingDate}
            style={styles.input}
          />
          <TextInput
            placeholder="Total Portions Available"
            value={totalPortions}
            onChangeText={setTotalPortions}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleCreateMeal}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Publishing Asset...' : 'Publish to Weekly Menu'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List Component */}
      <Text style={styles.sectionTitle}>Active Order Delivery Manifest</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.manifestCard}>
            <View style={styles.row}>
              <Text style={styles.boldText}>{item.meals?.dish_name || 'Unknown Meal'}</Text>
              <Text style={[
                styles.statusBadge, 
                { backgroundColor: item.status === 'confirmed' ? '#e6f4ea' : '#fff3e0',
                  color: item.status === 'confirmed' ? '#137333' : '#b06000' }
              ]}>
                {item.status?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.detailsText}>Customer: {item.profiles?.full_name || 'New Neighbor'}</Text>
            <Text style={styles.detailsText}>Address: {item.profiles?.address || 'Address Pending'}</Text>
            <Text style={styles.detailsText}>Portions Requested: {item.portions_requested}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f8fafc' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'center' },
  subHeader: { fontSize: 13, color: '#666', marginBottom: 15, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },
  
  // Interactive Form Elements Styling
  toggleButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  cancelToggleButton: { backgroundColor: '#64748b' },
  toggleButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 25 },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, fontSize: 15, marginBottom: 12, backgroundColor: '#fff' },
  textArea: { height: 60, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#16a34a', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 5 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Manifest Card List Layout Elements
  manifestCard: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  boldText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 11, fontWeight: 'bold' },
  detailsText: { fontSize: 14, color: '#555', marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center' }
});
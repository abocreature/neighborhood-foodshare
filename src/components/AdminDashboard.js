import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null); // Tracks layout loading spinners for row clicks
  
  // Form State Layout
  const [showForm, setShowForm] = useState(false);
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [servingDate, setServingDate] = useState(''); // Expected format: YYYY-MM-DD
  const [totalPortions, setTotalPortions] = useState('10'); // Default placeholder default count

  useEffect(() => {
    async function fetchMasterManifest() {
      try {
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

  const handleToggleOrderStatus = async (orderId, currentStatus) => {
    if (updatingId) return;
    setUpdatingId(orderId);

    // Toggle logic: if it's currently 'pending', mark it 'confirmed'. Otherwise, flip it back.
    const nextStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Pessimistic Client Update: Update local view array match instantly
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
    } catch (err) {
      console.error('Failed to patch order lifecycle status:', err.message);
    } finally {
      setUpdatingId(null);
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
          <View style={styles.datePickerContainer}>
            <Text style={styles.inputLabel}>Serving Date:</Text>
            <input
              type="date"
              value={servingDate}
              onChange={(e) => setServingDate(e.target.value)}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '15px',
                fontFamily: 'sans-serif',
                marginBottom: '12px',
                backgroundColor: '#fff',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </View>
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
        renderItem={({ item }) => {
          const isConfirmed = item.status === 'confirmed';

          return (
            <View style={[styles.manifestCard, isConfirmed && styles.confirmedManifestCard]}>
              <View style={styles.cardInfoSplit}>
                <View style={styles.row}>
                  <Text style={styles.boldText}>{item.meals?.dish_name || 'Unknown Meal'}</Text>
                  <Text style={[
                    styles.statusBadge, 
                    { backgroundColor: isConfirmed ? '#e6f4ea' : '#fff3e0',
                      color: isConfirmed ? '#137333' : '#b06000' }
                  ]}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.detailsText}>Customer: {item.profiles?.full_name || 'New Neighbor'}</Text>
                <Text style={styles.detailsText}>Address: {item.profiles?.address || 'Address Pending'}</Text>
                <Text style={styles.detailsText}>Portions Requested: {item.portions_requested}</Text>
              </View>

              {/* Check Mark Interaction Button Layout */}
              <TouchableOpacity 
                style={[styles.checkButton, isConfirmed && styles.confirmedCheckButton]}
                onPress={() => handleToggleOrderStatus(item.id, item.status)}
                disabled={updatingId === item.id}
              >
                <Text style={[styles.checkText, isConfirmed && styles.confirmedCheckText]}>
                  {updatingId === item.id ? '...' : '✓'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f8fafc' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'center' },
  subHeader: { fontSize: 13, color: '#666', marginBottom: 15, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },
  
  toggleButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  cancelToggleButton: { backgroundColor: '#64748b' },
  toggleButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 25 },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, fontSize: 15, marginBottom: 12, backgroundColor: '#fff' },
  textArea: { height: 60, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#16a34a', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 5 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  datePickerContainer: { width: '100%', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 4 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Manifest Card Structure (Side-by-Side Flex Split Row)
  manifestCard: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'space-between' },
  confirmedManifestCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  cardInfoSplit: { flex: 1, paddingRight: 10 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  boldText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 11, fontWeight: 'bold' },
  detailsText: { fontSize: 14, color: '#555', marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center' },

  // Check Mark Action Button Styles
  checkButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  confirmedCheckButton: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  checkText: { fontSize: 18, fontWeight: 'bold', color: '#cbd5e1', marginTop: -2 },
  confirmedCheckText: { color: '#fff' }
});
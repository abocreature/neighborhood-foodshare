import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dad's Delivery Manifest</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.manifestCard}>
            <View style={styles.row}>
              <Text style={styles.boldText}>{item.meals?.dish_name || 'Unknown Meal'}</Text>
              <Text style={styles.statusBadge}>{item.status}</Text>
            </View>
            <Text style={styles.detailsText}>Customer: {item.profiles?.full_name}</Text>
            <Text style={styles.detailsText}>Address: {item.profiles?.address}</Text>
            <Text style={styles.detailsText}>Portions Requested: {item.portions_requested}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#222' },
  manifestCard: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  boldText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { backgroundColor: '#ffe082', color: '#b78103', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  detailsText: { fontSize: 14, color: '#555', marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center' }
});
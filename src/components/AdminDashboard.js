import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingMealId, setDeletingMealId] = useState(null); 

  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
 
  const [adminView, setAdminView] = useState('manifest');
  const [showForm, setShowForm] = useState(false);
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [servingDate, setServingDate] = useState(''); // Expected format: YYYY-MM-DD

  const toggleFormView = () => {
    setShowForm(!showForm);
    setErrorText('');
    setSuccessText('');
  };

  async function fetchMasterManifest() {
    try {
      setErrorText('');
      const { data, orderError } = await supabase
        .from('orders')
        .select(`
          id,
          portions_requested,
          status,
          meals ( dish_name, serving_date ),
          profiles ( full_name, address )
        `)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .order('serving_date', { ascending: false});
      if (mealError) throw mealError;

      setOrders(data || []);
      setMeals(mealData || []);
    } catch (err) {
      setErrorText(`Dashboard reload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=> {
    fetchMasterManifest();
  }, []);

  // Form Submit Handler: Writes a new row to the 'meals' table
  const handleCreateMeal = async () => {
    setErrorText('');
    setSuccessText('');

    if (!dishName || !servingDate) {
      setErrorText('Dish Name and Serving Date are strictly required.');
      return;
    }
    
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('meals')
        .insert([
          {
            dish_name: dishName,
            description: description,
            serving_date: servingDate,
            chef_id: (await supabase.auth.getUser()).data.user?.id
          }
        ]).select('*');

      if (error) throw error;

      setSuccessText('New meal published successfully!');
      setDishName(''); setDescription(''); setServingDate('');
      
      // Clear form inputs and reset view state
      setDishName('');
      setDescription('');
      setServingDate('');

      if (data) setMeals(prev => [...prev, ...data].sort((a,b) => new Date(a.serving_date) - new Date(b.serving_date)));
      
    } catch (err) {
      setErrorText(err.message); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleOrderStatus = async (orderId, currentStatus) => {
    if (updatingId) return;
    setUpdatingId(orderId);
    setErrorText('');
    const nextStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
    } catch (err) {
      setErrorText(`Status update failed: ${err.message}`); 
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (deletingMealId) return;
    
    const confirmDelete = window.confirm("Are you absolute certain you want to delete this menu meal? This will cascade-wipe related customer delivery links.");
    if (!confirmDelete) return;

    setDeletingMealId(mealId);
    setErrorText('');
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;

      setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
      fetchMasterManifest();
    } catch (err) {
      setErrorText(`Deletion tracking failed: ${err.message}`); 
    } finally {
      setDeletingMealId(null);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;

  return (
    <View style={styles.container}>
      {errorText ? <Text style={styles.errorInlineText}>{errorText}</Text> : null}
      
      <View style={styles.subNavBar}>
        <TouchableOpacity 
          style={[styles.subNavButton, adminView === 'manifest' && styles.activeSubNavButton]}
          onPress={() => setAdminView('manifest')}
        >
          <Text style={[styles.subNavText, adminView === 'manifest' && styles.activeSubNavText]}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.subNavButton, adminView === 'menu' && styles.activeSubNavButton]}
          onPress={() => setAdminView('menu')}
        >
          <Text style={[styles.subNavText, adminView === 'menu' && styles.activeSubNavText]}>Meals</Text>
        </TouchableOpacity>
      </View>

      {adminView === 'manifest' && (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Current and Past Orders</Text>
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isConfirmed = item.status === 'confirmed';
              return (
                <View style={[styles.manifestCard, isConfirmed && styles.confirmedManifestCard]}>
                  <View style={styles.cardInfoSplit}>
                    <View style={styles.row}>
                      <Text style={styles.boldText}>{item.meals?.dish_name || 'Deleted Meal'}</Text>
                      <Text style={[styles.statusBadge, { backgroundColor: isConfirmed ? '#e6f4ea' : '#fff3e0', color: isConfirmed ? '#137333' : '#b06000' }]}>
                        {item.status?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.detailsText}>Customer: {item.profiles?.full_name}</Text>
                    <Text style={styles.detailsText}>Address: {item.profiles?.address}</Text>
                    <Text style={styles.detailsText}>Portions Requested: {item.portions_requested}</Text>
                  </View>
                  <TouchableOpacity style={[styles.checkButton, isConfirmed && styles.confirmedCheckButton]} onPress={() => handleToggleOrderStatus(item.id, item.status)} disabled={updatingId === item.id}>
                    <Text style={[styles.checkText, isConfirmed && styles.confirmedCheckText]}>{updatingId === item.id ? '...' : '✓'}</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      )}

      {adminView === 'menu' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={[styles.toggleButton, showForm && styles.cancelToggleButton]} onPress={toggleFormView}>
            <Text style={styles.toggleButtonText}>{showForm ? '✕ Close' : '+ Create New Menu Rotation'}</Text>
          </TouchableOpacity>

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Menu Item</Text>
              {errorText ? <Text style={styles.errorInlineText}>{errorText}</Text> : null}
              {successText ? <Text style={styles.successInlineText}>{successText}</Text> : null}
              <TextInput placeholder="Dish Name" value={dishName} onChangeText={setDishName} style={styles.input} />
              <TextInput placeholder="Description" value={description} onChangeText={setDescription} multiline style={[styles.input, styles.textArea]} />
              <View style={styles.datePickerContainer}>
                <Text style={styles.inputLabel}>Serving Date:</Text>
                <input type="date" value={servingDate} onChange={(e) => setServingDate(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', fontSize: '15px', fontFamily: 'sans-serif', marginBottom: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', width: '100%', boxSizing: 'border-box', color: '#cbd5e1',  }} />
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleCreateMeal} disabled={submitting}>
                <Text style={styles.submitButtonText}>{submitting ? 'Publishing...' : 'Publish to Menu'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Current and Past Menu</Text>
          <FlatList
            data={meals}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.menuManagementCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuDateText}>{new Date(item.serving_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</Text>
                  <Text style={styles.menuDishName}>{item.dish_name}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteMeal(item.id)} disabled={deletingMealId === item.id}>
                  <Text style={styles.deleteButtonText}>{deletingMealId === item.id ? '...' : '✕'}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
  },
  header: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#222', 
    textAlign: 'center' 
  },
  subHeader: { 
    fontSize: 13, 
    color: '#cbd5e1', 
    marginBottom: 15, 
    marginTop: 2, 
    textAlign: 'center' 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#cbd5e1', 
    marginBottom: 10, 
    marginTop: 10 
  },

  errorInlineText: { 
    color: '#ef4444', 
    backgroundColor: '#fef2f2', 
    padding: 10, 
    borderRadius: 6, 
    borderLeftWidth: 4, 
    borderLeftColor: '#ef4444', 
    fontSize: 14, 
    fontWeight: '500', 
    marginBottom: 15, 
    width: '100%', 
    textAlign: 'center' 
  },
  successInlineText: { 
    color: '#16a34a',
    backgroundColor: '#f0fdf4', 
    padding: 10, 
    borderRadius: 6, 
    borderLeftWidth: 4, 
    borderLeftColor: '#16a34a', 
    fontSize: 14, 
    fontWeight: '500', 
    marginBottom: 15, 
    width: '100%', 
    textAlign: 'center' 
  },

  subNavBar: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(94, 86, 80, 0.5)', 
    borderRadius: 8, 
    padding: 4, 
    marginBottom: 20 
  },
  subNavButton: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 6 
  },
  activeSubNavButton: { 
    backgroundColor: '#f97316'
  },
  subNavText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#cbd5e1', 
  },
  activeSubNavText: { 
    color: '#fef2f2'
  },
  
  toggleButton: { 
    backgroundColor: '#f97316', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  cancelToggleButton: { 
    backgroundColor: '#64748b' 
  },
  toggleButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  
  formCard: { 
    padding: 15, 
    marginBottom: 25 
  },
  formTitle: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#fef2f2', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    borderRadius: 6, 
    padding: 10, 
    fontSize: 15, 
    marginBottom: 12, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#cbd5e1'
  },
  textArea: { 
    height: 60, 
    textAlignVertical: 'top' 
  },
  submitButton: { 
    backgroundColor: '#f97316', 
    padding: 12, 
    borderRadius: 6, 
    alignItems: 'center', 
    marginTop: 5 
  },
  submitButtonText: { 
    color: '#fef2f2',  
    fontWeight: 'bold', 
    fontSize: 15 
  },
  datePickerContainer: { 
    width: '100%', 
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    marginBottom: 4
  },
  inputLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#cbd5e1',
    marginBottom: 6, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },

  menuManagementCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    backgroundColor: 'rgba(94, 86, 80, 0.5)',
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    borderWidth: 1, 
    marginBottom: 8 
  },
  menuDateText: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#f97316', 
    textTransform: 'uppercase' 
  },
  menuDishName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#e2e8f0', 
    marginTop: 2 
  },
  deleteButton: { 
    width: 26, 
    height: 26, 
    borderRadius: 13, 
    backgroundColor: '#fee2e2', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  deleteButtonText: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#ef4444', 
    marginTop: -1 
  },

  manifestCard: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: 'rgba(94, 86, 80, 0.5)',
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  confirmedManifestCard: { 
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    borderColor: '#f97316'
  },
  cardInfoSplit: { 
    flex: 1, 
    paddingRight: 10 
  },

  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  boldText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#f8fafc',  
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 12, 
    fontSize: 11, 
    fontWeight: 'bold' 
  },
  detailsText: { 
    fontSize: 14, 
    color: '#cbd5e1', 
    marginTop: 2 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center' 
  },

  checkButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#cbd5e1', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  confirmedCheckButton: { 
    backgroundColor: '#16a34a', 
    borderColor: '#16a34a' 
  },
  checkText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#cbd5e1', 
    marginTop: -2 
  },
  confirmedCheckText: { 
    color: '#fff' 
  }
});
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function ProfilePage({ user, onClose }) {
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  useEffect(() => {
    async function loadCurrentProfile() {
      try {
        setErrorText('');
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, address, phone')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setFullName(data.full_name || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
        }
      } catch (err) {
        setErrorText(`Failed to load profile data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    setErrorText('');
    setSuccessText('');

    if (!fullName || !address || !phone) {
      setErrorText('All profile data fields are strictly required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          address: address,
          phone: phone
        })
        .eq('id', user.id);

      if (error) throw error;
      setSuccessText('Your account details successfully updated!');
    } catch (err) {
      setErrorText(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <div style={{ width: '100%', maxWidth: 400, padding: '20px' }}>
        
        <View style={styles.cardHeader}>
          <Text style={styles.header}>My Account Details</Text>
          <TouchableOpacity style={styles.cancelX} onPress={onClose}>
            <Text style={styles.cancelXText}>✕</Text>
          </TouchableOpacity>
        </View>

        {errorText ? <Text style={styles.errorInlineText}>{errorText}</Text> : null}
        {successText ? <Text style={styles.successInlineText}>{successText}</Text> : null}

        <View style={styles.fieldBox}>
          <Text style={styles.inputLabel}>Full Name:</Text>
          <TextInput value={fullName} onChangeText={setFullName} style={styles.input} />
        </View>

        <View style={styles.fieldBox}>
          <Text style={styles.inputLabel}>Delivery Address:</Text>
          <TextInput value={address} onChangeText={setAddress} style={styles.input} />
        </View>

        <View style={styles.fieldBox}>
          <Text style={styles.inputLabel}>Phone Number:</Text>
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving Adjustments...' : 'Save Settings'}</Text>
        </TouchableOpacity>

      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 5, 
    alignItems: 'center' 
  },
  cardHeader: { 
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'relative', 
    marginBottom: 15 
  },
  header: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fef2f2',  
    textAlign: 'center' 
  },
  subHeader: { 
    fontSize: 13, 
    color: '#cbd5e1', 
    marginBottom: 20, 
    marginTop: 4, 
    textAlign: 'center' 
  },
  
  cancelX: { 
    position: 'absolute', 
    right: -40, 
    width: 28, 
    height: 28, 
    backgroundColor: '#fee2e2', 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cancelXText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#ef4444', 
    marginTop: -1 
  },

  fieldBox: { 
    width: '100%', 
    flexDirection: 'column', 
    marginTop: 15 
  },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#cbd5e1', 
    marginBottom: 6, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    padding: 12, 
    borderRadius: 6, 
    fontSize: 15, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    width: '100%', 
    boxSizing: 'border-box',
    color: '#cbd5e1', 
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',  
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
  
  saveButton: { 
    backgroundColor: '#f97316', 
    padding: 14, 
    borderRadius: 6, 
    alignItems: 'center', 
    marginTop: 10 
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

// --- THEME ---
const COLORS = {
  bg: '#F8F9FD',
  primary: '#002d69',
  cardBg: '#ffffff',
  textMain: '#1e293b',
  textSub: '#64748b',
  border: '#e2e8f0',
  inputBg: '#f1f5f9',
};

const AddStaffScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [fetchingList, setFetchingList] = useState(true);

  useEffect(() => {
    setNavigationRef(navigation);
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      setFetchingList(true);
      const response = await fetchWithToken(`${SERVER_URL}/team-lead/staff-list`);

      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (error) {
      console.error('Error fetching staff list:', error);
    } finally {
      setFetchingList(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!name || !password) {
      Alert.alert('Missing Fields', 'Please fill in all details.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetchWithToken(`${SERVER_URL}/team-lead/add-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create staff');
      }

      // Set generated ID to display
      setGeneratedId(data.sales_executive_id);

      // Add to staff list
      setStaffList(prev => [
        {
          id: data.sales_executive_id,
          full_name: name,
          username: data.sales_executive_id,
          password: password // Store for display only
        },
        ...prev
      ]);

      // Show success alert
      Alert.alert(
        'Success',
        `${data.message}\n\nGenerated ID: ${data.sales_executive_id}\n\nThis ID will be used for login.`,
        [
          { text: 'OK' }
        ]
      );

      // Clear form but keep generated ID visible
      setName('');
      setPassword('');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to create staff account'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reusable Input Component
  const InputField = ({ label, icon, value, onChangeText, placeholder, isPassword = false }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={isPassword && !showPassword}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Staff</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>

          {/* Header / Icon Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIconCircle}>
              <MaterialCommunityIcons name="account-plus" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>Staff Onboarding</Text>
            <Text style={styles.heroSubtitle}>Create credentials for new sales executives</Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.formCard}>
            <InputField
              label="Full Name"
              icon="account"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Sales Executive ID will be auto-generated based on your store
              </Text>
            </View>

            <InputField
              label="Password"
              icon="lock"
              placeholder="Enter secure password"
              value={password}
              onChangeText={setPassword}
              isPassword={true}
            />
          </View>

          {/* ACTION BUTTON */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.btnDisabled]}
            activeOpacity={0.8}
            onPress={handleCreateStaff}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Create Staff Account</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* GENERATED ID DISPLAY */}
          {generatedId && (
            <View style={styles.generatedIdBox}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.generatedIdLabel}>Last Generated ID</Text>
                <Text style={styles.generatedIdValue}>{generatedId}</Text>
              </View>
            </View>
          )}

          {/* STAFF LIST TABLE */}
          <View style={styles.staffListSection}>
            <Text style={styles.sectionTitle}>Created Staff Accounts</Text>

            {fetchingList ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : staffList.length === 0 ? (
              <Text style={styles.emptyText}>No staff accounts created yet</Text>
            ) : (
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>ID</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Password</Text>
                </View>

                {/* Table Rows */}
                {staffList.map((staff, index) => (
                  <View key={staff.id || index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                      {staff.full_name || staff.username}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                      {staff.username}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                      {staff.password || '••••••'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddStaffScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  /* HEADER */
  headerContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

  content: { padding: 20 },

  /* HERO SECTION */
  heroSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  heroIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 15,
    borderWidth: 1, borderColor: '#c7d2fe'
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  heroSubtitle: { fontSize: 14, color: COLORS.textSub, marginTop: 5 },

  /* FORM STYLES */
  formCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20, marginBottom: 25,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, height: 50,
  },
  iconBox: { width: 50, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 15, color: COLORS.textMain, height: '100%' },
  eyeIcon: { paddingHorizontal: 15, justifyContent: 'center', height: '100%' },

  /* INFO BOX */
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    marginLeft: 8,
    lineHeight: 18,
  },

  /* BUTTON */
  createButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginRight: 8 },

  /* GENERATED ID BOX */
  generatedIdBox: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
  },
  generatedIdLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    marginBottom: 2,
  },
  generatedIdValue: {
    fontSize: 18,
    color: '#15803d',
    fontWeight: '800',
    fontFamily: 'monospace',
  },

  /* STAFF LIST */
  staffListSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: 'center',
    marginTop: 20,
  },

  /* TABLE STYLES */
  table: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    fontSize: 13,
    color: COLORS.textMain,
  },
});
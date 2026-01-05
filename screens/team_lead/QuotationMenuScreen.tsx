import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
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
  redAccent: '#ef4444',    // High Urgency
  orangeAccent: '#f59e0b', // Medium Urgency
  greenAccent: '#10b981',  // Low Urgency
};

const QuotationMenuScreen = ({ navigation }: any) => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch quotations from backend
  useEffect(() => {
    setNavigationRef(navigation);
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetchWithToken(`${SERVER_URL}/team-lead/pending-approvals`);

      if (!response.ok) {
        throw new Error('Failed to fetch quotations');
      }

      const data = await response.json();

      // Transform API data to match UI format
      const transformed = data.map((item: any) => ({
        lead_id: item.lead_id,
        id: item.quotation_id || `L-${item.lead_id}`,
        clientName: item.client_name,
        amount: `₹${(item.amount || 0).toLocaleString('en-IN')}`,
        urgency: item.priority || 'Normal',
        salesPerson: item.sales_rep_name,
        date: item.submitted_at
          ? new Date(item.submitted_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
          : 'N/A',
        status: 'Pending Approval',
      }));

      setQuotations(transformed);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get color based on urgency
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'High': return COLORS.redAccent;
      case 'Medium': return COLORS.orangeAccent;
      default: return COLORS.greenAccent;
    }
  };

  const renderQuotationCard = ({ item }: any) => {
    const urgencyColor = getUrgencyColor(item.urgency);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('QuotationApprovalScreen', {
          quotation: item,
          onRefresh: fetchQuotations
        })}
      >

        <View style={styles.cardContent}>

          {/* Top Row: Client Name & Amount */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.clientName}>{item.clientName}</Text>
              <Text style={styles.idText}>#{item.id}</Text>
            </View>
            <View style={styles.amountBadge}>
              <Text style={styles.amountText}>{item.amount}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Row: Sales Person & Urgency Tag */}
          <View style={styles.detailsRow}>

            {/* Sales Person */}
            <View style={styles.userBlock}>
              <View style={styles.smallAvatar}>
                <MaterialCommunityIcons name="account" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.userName}>{item.salesPerson}</Text>
            </View>

            {/* Urgency Badge */}
            <View style={[styles.urgencyBadge, { borderColor: urgencyColor }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={12} color={urgencyColor} style={{ marginRight: 4 }} />
              <Text style={[styles.urgencyText, { color: urgencyColor }]}>{item.urgency} Priority</Text>
            </View>

          </View>

        </View>

        {/* Right Chevron */}
        <View style={styles.chevronContainer}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
        </View>

      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Quotations</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textSub }}>Loading quotations...</Text>
        </View>
      ) : quotations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialCommunityIcons name="file-document-outline" size={64} color={COLORS.textSub} />
          <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.textSub, textAlign: 'center' }}>
            No pending quotations
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotations}
          renderItem={renderQuotationCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default QuotationMenuScreen;

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

  listContainer: { padding: 20 },

  /* CARD */
  card: {
    flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, marginBottom: 16,
    overflow: 'hidden', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  accentBar: { width: 5 },

  cardContent: { flex: 1, padding: 16, paddingRight: 5 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientName: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  idText: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },

  amountBadge: { backgroundColor: '#f0f9ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  amountText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  userBlock: { flexDirection: 'row', alignItems: 'center' },
  smallAvatar: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center', marginRight: 8
  },
  userName: { fontSize: 13, fontWeight: '600', color: COLORS.textMain },

  urgencyBadge: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: '#fff'
  },
  urgencyText: { fontSize: 10, fontWeight: '700' },

  chevronContainer: { justifyContent: 'center', paddingRight: 10 },
});
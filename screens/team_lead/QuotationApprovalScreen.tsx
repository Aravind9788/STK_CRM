import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
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
  green: '#10b981',
  red: '#ef4444',
};

const QuotationApprovalScreen = ({ navigation, route }: any) => {
  const { quotation, onRefresh } = route.params;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNavigationRef(navigation);
  }, []);

  const handleAction = async (action: string) => {
    Alert.alert(
      `${action} Quotation?`,
      `Are you sure you want to ${action.toLowerCase()} this quotation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSubmitting(true);

              const response = await fetchWithToken(`${SERVER_URL}/team-lead/approval-action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lead_id: quotation.lead_id,
                  action: action.toUpperCase()
                })
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.detail || 'Failed to process action');
              }

              Alert.alert(
                'Success',
                `Quotation ${action.toLowerCase()}ed successfully`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (onRefresh) onRefresh(); // Refresh the list
                      navigation.goBack();
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || `Failed to ${action.toLowerCase()} quotation`
              );
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Reusable Card
  const DetailCard = ({ title, icon, children }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        {children}
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
        <Text style={styles.headerTitle}>Review Quotation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. SALES PERSON INFO (Outside Quotation) */}
        <View style={styles.salesPersonCard}>
          <View style={styles.spLeft}>
            <View style={styles.spAvatar}>
              <Text style={styles.spInitials}>{quotation.salesPerson.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.spLabel}>Submitted By</Text>
              <Text style={styles.spName}>{quotation.salesPerson}</Text>
            </View>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{quotation.date}</Text>
          </View>
        </View>

        {/* 2. QUOTATION SUMMARY */}
        <DetailCard title="Quotation Details" icon="file-document-outline">
          <View style={styles.detailRow}>
            <Text style={styles.label}>Client Name</Text>
            <Text style={styles.value}>{quotation.clientName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Quotation ID</Text>
            <Text style={styles.value}>#{quotation.id}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.label}>Total Amount</Text>
            <Text style={[styles.value, styles.amountValue]}>{quotation.amount}</Text>
          </View>
        </DetailCard>

        {/* 3. LINE ITEMS */}
        {quotation.items && quotation.items.length > 0 ? (
          <DetailCard title="Items / Scope" icon="format-list-bulleted">
            {quotation.items.map((item: string, index: number) => (
              <View key={index} style={styles.itemRow}>
                <MaterialCommunityIcons name="circle-small" size={24} color={COLORS.primary} />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </DetailCard>
        ) : (
          <DetailCard title="Quotation Details" icon="format-list-bulleted">
            <Text style={styles.itemText}>
              Quotation ID: {quotation.id}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textSub, marginTop: 8 }}>
              Full quotation details available in the system
            </Text>
          </DetailCard>
        )}

        {/* 4. APPROVAL ACTIONS (Inside ScrollView) */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn, submitting && styles.btnDisabled]}
            onPress={() => handleAction('Reject')}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
                <Text style={styles.btnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.approveBtn, submitting && styles.btnDisabled]}
            onPress={() => handleAction('Approve')}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.btnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

export default QuotationApprovalScreen;

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

  scrollContent: { padding: 20 },

  /* SALES PERSON CARD */
  salesPersonCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#e0e7ff', padding: 15, borderRadius: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#c7d2fe'
  },
  spLeft: { flexDirection: 'row', alignItems: 'center' },
  spAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  spInitials: { color: '#fff', fontWeight: '700', fontSize: 16 },
  spLabel: { fontSize: 10, color: '#4338ca', fontWeight: '600', textTransform: 'uppercase' },
  spName: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  dateBadge: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dateText: { fontSize: 11, fontWeight: '600', color: '#4338ca' },

  /* CARD STYLES */
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, marginBottom: 16, padding: 16,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { paddingLeft: 4 },

  /* DETAIL ROWS */
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  label: { fontSize: 13, color: COLORS.textSub },
  value: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  amountValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },

  /* ITEM ROWS */
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemText: { fontSize: 14, color: COLORS.textMain, marginLeft: 0 },

  /* ACTION BUTTONS */
  actionContainer: { flexDirection: 'row', gap: 15, marginTop: 10 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, elevation: 2
  },
  rejectBtn: { backgroundColor: COLORS.red },
  approveBtn: { backgroundColor: COLORS.green },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 6 },
});
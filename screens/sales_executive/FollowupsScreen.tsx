import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  Image,
  Platform,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../../config';

// --- Dummy Data matching your image ---
const FOLLOWUP_DATA = [
  {
    id: '1',
    name: 'Priya Interior',
    note: 'Followup call was missed',
    statusBadge: 'Needs Attention',
    statusColor: '#EF4444', // Red
    date: 'Oct 31',
    type: 'missed',
  },
  {
    id: '2',
    name: 'Mr. Rajesh Kumar',
    note: 'Quote Sent: ₹1,12,500',
    statusBadge: 'Immediate',
    statusColor: '#F97316', // Orange
    date: 'Nov 15',
    type: 'quote',
  },
  {
    id: '3',
    name: 'Ahuja Constructions',
    note: 'Site visit scheduled for Nov 18',
    statusBadge: null,
    statusColor: null,
    date: 'Nov 18',
    type: 'site_visit',
  },
  {
    id: '4',
    name: 'Bansal Retail',
    note: 'New Lead - Awaiting first call',
    statusBadge: 'Enquiry Only',
    statusColor: '#64748B', // Grey
    date: 'Nov 14',
    type: 'lead',
  },
  {
    id: '5',
    name: 'Green View Architects',
    note: 'Material sample requested',
    statusBadge: 'Sample Sent',
    statusColor: '#10B981', // Green
    date: 'Nov 12',
    type: 'sample',
  },
  {
    id: '6',
    name: 'Metro Builders',
    note: 'Negotiation in progress',
    statusBadge: 'Followup',
    statusColor: '#004aad', // Brand Blue
    date: 'Nov 16',
    type: 'negotiation',
  },
];

const FollowupsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Today');
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  

  const fetchFollowups = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${SERVER_URL}/leads/follow-up-leads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${token}`  // if JWT enabled
        },
      });

      const data = await response.json();

      setFollowups(data);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to load follow-ups');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchFollowups();
  }, []);

  const updateFollowup = async (leadId: string) => {
    try {
      const response = await fetch(
        `${SERVER_URL}/leads/follow-up-lead-update`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: leadId,
            status_update: 'Followed Up',
            next_followup_date: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        }
      );

      const result = await response.json();
      Alert.alert('Success', result.message);

      fetchFollowups(); // refresh list
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to update follow-up');
    }
  };

  // Helper to render individual cards
  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('QuotationDetails', {
          leadId: item.id,
          customerName: item.name,
          status: item.statusBadge,
          estimatedValue: item.note,
        })
      }

    >

      {/* Header Row: Name & Avatar */}
      < View style={styles.cardHeader} >
        <View style={styles.nameContainer}>
          <View style={styles.avatarContainer}>
            <Icon name="account" size={16} color="#004aad" />
          </View>
          <Text style={styles.clientName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        {/* Date Row - Separate from name */}
        <View style={styles.dateRow}>
          <View style={styles.dateBadge}>
            <Icon
              name="calendar-month-outline"
              size={14}
              color="#666666"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      </View >

      {/* Badges (Optional) */}
      {
        item.statusBadge && (
          <View
            style={[
              styles.badgeContainer,
              { backgroundColor: item.statusColor + '20' },
            ]}>
            <Text style={[styles.badgeText, { color: item.statusColor }]}>
              {item.statusBadge}
            </Text>
          </View>
        )
      }

      {/* Content Note */}
      <Text style={styles.noteText} numberOfLines={2}>
        {item.note}
      </Text>

      {/* Action Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Icon
            name={
              item.type === 'missed'
                ? 'phone-alert'
                : item.type === 'quote'
                  ? 'file-document-outline'
                  : item.type === 'sample'
                    ? 'package-variant'
                    : item.type === 'negotiation'
                      ? 'handshake-outline'
                      : 'clock-outline'
            }
            size={16}
            color="#004aad"
          />
          <Text style={styles.footerLabel}>View details</Text>
        </View>
        <Icon name="chevron-right" size={16} color="#cccccc" />
      </View>
    </TouchableOpacity >
  );
  // Filter data based on active tab
  const mappedData = followups.map((l) => ({
    id: l.lead_id,
    name: l.customer_name,
    note: l.last_action,
    date: new Date(l.next_followup).toDateString().slice(4, 10),
    statusBadge: l.status,
    statusColor:
      l.status === 'Open'
        ? '#004aad'
        : l.status === 'Closed'
          ? '#10B981'
          : '#F97316',
    type: 'followup',
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color="#004aad" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {/* Logo Placeholder like "STK Associates" */}
          <View style={styles.logoRow}>
            <Image
              source={{
                uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png',
              }}
              style={styles.logo}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Icon name="filter-variant" size={24} color="#004aad" />
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>My Followups</Text>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{FOLLOWUP_DATA.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {FOLLOWUP_DATA.filter((item) => item.type === 'missed').length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>4</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>

      {/* --- Tabs --- */}
      <View style={styles.tabContainer}>
        {['Today', 'Overdue', 'All'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* --- List Content --- */}
      <FlatList
        data={mappedData}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={() => (
          <Text style={styles.resultsText}>
            Showing {mappedData.length} followup
            {mappedData.length !== 1 ? 's' : ''}
          </Text>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // === Background ===
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: StatusBar.currentHeight || 0,
      },
    }),
  },

  // === Header ===
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002d69',
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#002d69',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: -0.5,
  },

  // === Stats Bar ===
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6f0ff',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004aad',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f5f5f5',
  },

  logo: {
    // Remote images need a fixed size
    width: 180,
    height: 100,
    // 'contain' makes sure the whole logo fits inside the box without being cut off
    resizeMode: 'contain',
  },

  // === Tabs ===
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    position: 'relative',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#004aad',
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 2,
    height: 3,
    width: '60%',
    backgroundColor: '#004aad',
    borderRadius: 1.5,
  },

  // === List ===
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 16,
    marginLeft: 4,
  },

  // === Cards (Grid Item) ===
  card: {
    backgroundColor: '#ffffff',
    width: '48%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6f0ff',
    shadowColor: '#002d69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 180, // Ensure consistent card height
  },

  cardHeader: {
    marginBottom: 12,
    flexDirection: 'column', // Changed from row to column
    alignItems: 'flex-start', // Align everything to the left
  },

  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Take full width
    marginBottom: 8,
  },

  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0, // Prevent avatar from shrinking
  },

  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002d69',
    flex: 1, // Take available space
    flexWrap: 'wrap', // Allow text to wrap
    lineHeight: 18,
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start', // Align to left
  },
  dateText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
  },

  badgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  noteText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 16,
    flex: 1,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
    marginTop: 'auto',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 11,
    color: '#004aad',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default FollowupsScreen;

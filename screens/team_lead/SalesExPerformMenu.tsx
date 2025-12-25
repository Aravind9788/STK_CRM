import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
// Use SafeAreaView from safe-area-context for better notched phone support
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#002d69';

const SalesExPerformMenu = ({ navigation }: any) => {
  return (
    // 'edges' prop ensures it only adds padding to the top and sides, not the bottom if not needed
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* ===== HEADER (Matched to Store Screen) ===== */}
        <View style={styles.header}>
          {/* Back Arrow */}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={26}
              color={PRIMARY_COLOR}
            />
          </TouchableOpacity>

          {/* Center Logo */}
          <Image
            source={{
              uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png',
            }}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Spacer to keep logo centered */}
          <View style={{ width: 26 }} />
        </View>

        {/* PAGE TITLE */}
        <Text style={styles.pageTitle}>Sales Executive Overview</Text>

        {/* OVERALL PERFORMANCE */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TeamPerformanceDashboard')}
        >
          <View style={styles.cardRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="chart-donut"
                size={26}
                color="#2563eb"
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Overall Team Performance</Text>
              <Text>Total Leads: 120</Text>
              <Text>Converted: 42%</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* INDIVIDUAL PERFORMANCE */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('IndividualPerformance')}
        >
          <View style={styles.cardRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name='account-tie'
                size={26}
                color="#2563eb"
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Individual Performance</Text>
              <Text>Top Performer: Anand</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* PENDING LEADS */}
        <TouchableOpacity
          style={[styles.card, styles.warningCard]}
          onPress={() => navigation.navigate('PendingLeadsOverview')}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, styles.warningIcon]}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={26}
                color="#d97706"
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Pending Leads</Text>
              <Text>Pending: 15</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* LOW PERFORMER */}
        <TouchableOpacity
          style={[styles.card, styles.dangerCard]}
          onPress={() => navigation.navigate('LowPerformerProfiles')}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, styles.dangerIcon]}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={26}
                color="#dc2626"
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Low Performer Alert</Text>
              <Text>Kumar</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SalesExPerformMenu;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    padding: 16,
  },

  /* ===== HEADER STYLES ===== */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 10, // Added small extra margin for better spacing
  },
  logo: {
    width: 120,
    height: 40,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginBottom: 16,
    marginTop: 8,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e6f0ff',
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  warningIcon: {
    backgroundColor: '#fffbeb',
  },
  dangerIcon: {
    backgroundColor: '#fef2f2',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginBottom: 6,
  },
  warningCard: {
    borderColor: '#fde68a',
  },
  dangerCard: {
    borderColor: '#fecaca',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
declare var require: any;


const PRODUCTS_DATA = [
  {
    id: '1',
    name: 'Gypsum Board',
    priceLabel: 'Starting From: ₹45/sqft',
    imageColor: '#e6f0ff',
    icon: 'wall',
    image: require('../../assets/Gypsum.png'),
  },
  {
    id: '2',
    name: 'Grid Ceiling',
    priceLabel: 'Price Range: ₹50-120/sqft',
    imageColor: '#f7f9fb',
    icon: 'grid',
    image: require('../../assets/GridCeiling.png'),
  },
  {
    id: '3',
    name: 'Insu Board',
    priceLabel: 'Starting From: ₹80/sqft',
    imageColor: '#e6f0ff',
    icon: 'layers-triple',
    image: require('../../assets/Gypsum.png'),
  },
  {
    id: '4',
    name: 'Dry Wall Partition',
    priceLabel: 'Pricing From: ₹100-250/sqft',
    imageColor: '#f7f9fb',
    icon: 'view-week',
    image: require('../../assets/DryWall.png'),
  },
  {
    id: '5',
    name: 'PVC Panels',
    priceLabel: 'Starting From: ₹35/sqft',
    imageColor: '#e6f0ff',
    icon: 'view-dashboard',
    image: require('../../assets/PVCWallPanels.png'),
  },
  {
    id: '6',
    name: 'Glass Wool',
    priceLabel: 'Starting From: ₹25/sqft',
    imageColor: '#f7f9fb',
    icon: 'weather-snowy',
    image: require('../../assets/DryWall.png'),
  },
  {
    id: '7',
    name: 'MR Board',
    priceLabel: 'Moisture Resistant: ₹65/sqft',
    imageColor: '#e6f0ff',
    icon: 'water',
    image: require('../../assets/Gypsum.png'),
  },
  {
    id: '8',
    name: 'Acoustic Board',
    priceLabel: 'Starting From: ₹95/sqft',
    imageColor: '#f7f9fb',
    icon: 'volume-high',
    image: require('../../assets/GridCeiling.png'),
  },
];


const CatalogScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(PRODUCTS_DATA);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(PRODUCTS_DATA);
    } else {
      const filtered = PRODUCTS_DATA.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery]);

  const renderProductItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      {/* Correct Source Usage */}
      <Image 
        source={item.image} 
        style={styles.productImage}
      />
      
      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>{item.priceLabel}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa" 
      />
      
      {/* Main Content Container */}
      <View style={styles.container}>
        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <Icon name="chevron-left" size={28} color="#004aad" />
          </TouchableOpacity>
          
          {/* Centered Logo block */}
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              {/* Remote URL Logo */}
              <Image 
                source={{ uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png' }} 
                style={styles.logo}
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="filter-variant" size={24} color="#004aad" />
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Our Products</Text>
        <Text style={styles.pageSubtitle}>Building Materials & Interior Solutions</Text>

        {/* --- Search Bar --- */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#666666" style={{marginRight: 10}} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#cccccc" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Counter */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            {searchQuery ? ` for "${searchQuery}"` : ''}
          </Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Icon name="sort-alphabetical-ascending" size={16} color="#004aad" />
            <Text style={styles.sortText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* --- Product Grid --- */}
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package-variant" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // === Safe Area View ===
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
  
  // === Main Container ===
  container: {
    flex: 1,
  },
  
  // --- Header ---
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
    ...Platform.select({
      ios: {
        paddingTop: 10,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  navBtn: { 
    width: 40, 
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  filterBtn: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  
  // Logo Styles
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoRow:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height:40,
  },
  logo: {
    width: 180,
    height: 100,
    resizeMode: 'contain',
  },

  // Page Title
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#002d69',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: -0.5
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500'
  },

  // --- Search Bar ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6f0ff',
    shadowColor: "#002d69",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#002d69',
    height: '100%',
    fontWeight: '500'
  },

  // Results Container
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16
  },
  resultsText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500'
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#004aad20'
  },
  sortText: {
    fontSize: 12,
    color: '#004aad',
    fontWeight: '600',
    marginLeft: 4
  },

  // --- Grid List ---
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 30 
  },
  columnWrapper: { 
    justifyContent: 'space-between',
    marginBottom: 12
  },

  // --- Product Card ---
  card: {
    backgroundColor: '#ffffff',
    width: '48%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6f0ff',
    shadowColor: "#002d69",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  cardContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002d69',
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004aad',
    marginTop:10,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center'
  }
});

export default CatalogScreen;
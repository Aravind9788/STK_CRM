import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';
import { useNavigation } from '@react-navigation/native';

// --- Types for API Data ---
interface Category {
  name: string;
  sub_categories: SubCategory[];
}

interface SubCategory {
  name: string;
  Suggested_product: SuggestedProduct[];
  channel: ChannelType[];
  accessories: AccessoryType[];
  gridtype: GridType[];
}

interface MasterData {
  categories: Category[];
  sources: string[];
  districts: string[];
  materials: Material[];
  accessories: Accessory[];
}

interface SuggestedProduct {
  name: string;
  price: string;
  price_bar: string;
}

interface ChannelType {
  name: string;
  variants: ChannelVariant[];
}

interface ChannelVariant {
  brand: string;
  variant: string;
  price_bar: string;
}

interface AccessoryType {
  name: string;
  variants: AccessoryVariant[];
}

interface AccessoryVariant {
  brand: string;
  variant: string;
  price_bar: string;
}

interface GridType {
  name: string;
  variants: GridVariant[];
}

interface GridVariant {
  brand: string;
  variant: string;
  price_bar: string;
}

interface Material {
  id: number;
  name: string;
  brand: string;
  price: number;
  unit: string;
}

interface Accessory {
  id: number;
  name: string;
  price: number;
  unit: string;
}

// Internal item types used in UI lists
interface MaterialItem {
  id: number;
  name: string;
  qty: string;
  price: string;
  total: number;
  brand?: string;
  unit?: string;
}

interface AccessoryItem {
  id: number;
  name: string;
  qty: string;
  price: string;
  total: number;
  unit?: string;
}

interface CustomerDetails {
  name: string;
  location: string;
  district: string;
  profile: string;
  source: string;
}

type CostDetail = { item: string; qty: string; price: string; total: number };

interface FormData {
  createdOn: string;
  leadSource: string;
  fullName: string;
  phone: string;
  location: string;
  district: string;
  customerProfile: string;
  areaSqft: string;
  projectType: string;
  boardType: string;
  brand: string;
  channelType: string;
  tataType: string;
  thickness: string;
  urgency: 'Immediate' | 'In a week' | 'In a month' | 'Not required';

  costDetails: CostDetail[];
  totalCost: number;
  materialList: MaterialItem[];
  accessoryList: AccessoryItem[];
}



// --- Types & Data ---
const INITIAL_DATA: FormData = {
  createdOn: new Date().toISOString(),
  leadSource: '',
  fullName: '',
  phone: '',
  location: '',
  district: '',
  customerProfile: '',
  areaSqft: '',
  projectType: '',
  boardType: '',
  brand: '',
  channelType: '',
  tataType: '',
  thickness: '',
  urgency: 'Not required',
  costDetails: [],
  totalCost: 0,
  materialList: [],
  accessoryList: [],
};

const QuoteBuilderScreen = ({ navigation }: { navigation: any }) => {
  const [currentStep, setCurrentStep] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [customerId, setCustomerId] = useState<string>('');
  const [isMaterialMode, setIsMaterialMode] = useState<boolean>(false);
  const [materialQty, setMaterialQty] = useState<string>('');
  const [materialPrice, setMaterialPrice] = useState<string>('');
  const [selectedAccessory, setSelectedAccessory] = useState<string>('');
  const [accessoryQty, setAccessoryQty] = useState<string>('');
  const [accessoryPrice, setAccessoryPrice] = useState<string>('');
  const [accessoriesList, setAccessoriesList] = useState<AccessoryItem[]>([]);
  const [materialList, setMaterialList] = useState<MaterialItem[]>([]);
  const [showAccessoryDropdown, setShowAccessoryDropdown] = useState<boolean>(false);
  const [showBoardTypeDropdown, setShowBoardTypeDropdown] = useState<boolean>(false);
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [channelVariantOptions, setChannelVariantOptions] = useState<ChannelVariant[]>([]);


  // --- Master Data States ---
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);
  const [isMasterDataLoaded, setIsMasterDataLoaded] = useState(false);

  // Current selection states for hierarchical data
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedSuggestedProduct, setSelectedSuggestedProduct] = useState<SuggestedProduct | null>(null);
  const [selectedChannelType, setSelectedChannelType] = useState<ChannelType | null>(null);
  const [tataOptions, setTataOptions] = useState<string[]>([]);

  const [selectedChannelVariant, setSelectedChannelVariant] = useState<ChannelVariant | null>(null);
  const [selectedGridType, setSelectedGridType] = useState<GridType | null>(null);
  const [selectedGridVariant, setSelectedGridVariant] = useState<GridVariant | null>(null);

  // Available options based on selections
  const [projectTypeOptions, setProjectTypeOptions] = useState<string[]>([]);
  const [boardTypeOptions, setBoardTypeOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [channelOptions, setChannelOptions] = useState<string[]>([]);
  const [gridTypeOptions, setGridTypeOptions] = useState<string[]>([]);
  const [gridVariantOptions, setGridVariantOptions] = useState<GridVariant[]>([]);
  const [accessoryOptions, setAccessoryOptions] = useState<AccessoryType[]>([]);
  const [accessoryVariantOptions, setAccessoryVariantOptions] = useState<AccessoryVariant[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [timeLogs, setTimeLogs] = useState({
    leadStart: INITIAL_DATA.createdOn, // Start when screen loads
    leadEnd: '',
    approverStart: '',
    approverEnd: '',
    quoteStart: '',
    quoteEnd: ''
  });
  const [quotationId, setQuotationId] = useState('');
  const [quotationDate, setQuotationDate] = useState('');
  // Fetch master data on component mount
  useEffect(() => {
    fetchMasterData();
  }, []);

  const generateQuotationId = () => {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const random = Math.floor(100 + Math.random() * 900); // 3 digit

    return `QT-${yyyy}-${mm}-${dd}-${random}`;
  };

  const getTodayDate = () => {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  };
  useEffect(() => {
    setQuotationId(generateQuotationId());
    setQuotationDate(getTodayDate());
  }, []);

  // Update available options when selections change
  useEffect(() => {
    if (masterData) {
      // Extract project types from categories
      const projectTypes = masterData.categories.map(cat => cat.name);
      setProjectTypeOptions(projectTypes);

      // Set initial category based on default project type
      const defaultCategory = masterData.categories.find(cat => cat.name);
      setSelectedCategory(defaultCategory || null);

      if (defaultCategory) {
        // Extract board types from sub_categories
        const boardTypes = defaultCategory.sub_categories.map(sub => sub.name);
        setBoardTypeOptions(boardTypes);

        // Set initial sub-category based on default board type
        const defaultSubCategory = defaultCategory.sub_categories.find(
          sub => sub.name
        );
        setSelectedSubCategory(defaultSubCategory || null);

        if (defaultSubCategory) {
          // Extract brand options from suggested products
          const brands = defaultSubCategory.Suggested_product.map(product => product.name);
          setBrandOptions(brands);

          // Extract channel options
          const channels = defaultSubCategory.channel.map(ch => ch.name);
          setChannelOptions(channels);

          // Extract grid type options
          const gridTypes = defaultSubCategory.gridtype.map(grid => grid.name);
          setGridTypeOptions(gridTypes);

          // Extract accessory options
          setAccessoryOptions(defaultSubCategory.accessories);
        }
      }
    }
  }, [masterData]);

  // Update channel variants when channel type is selected
  useEffect(() => {
    if (selectedSubCategory && formData.channelType) {
      const channel = selectedSubCategory.channel.find(ch => ch.name);
      setSelectedChannelType(channel || null);
      if (channel) {
        const tataTypes = channel.variants.map(
          v => `${v.brand} ${v.variant}`
        );
        setChannelVariantOptions(channel.variants);

        if (!formData.tataType && tataTypes.length > 0) {
          setFormData(prev => ({ ...prev, tataType: tataTypes[0] }));
        }

        if (channel.variants.length > 0) {
          setSelectedChannelVariant(channel.variants[0]);
        }
      }
    }
  }, [selectedSubCategory, formData.channelType]);

  // Update grid variants when grid type is selected
  useEffect(() => {
    if (selectedSubCategory && formData.boardType) {
      const grid = selectedSubCategory.gridtype.find(gt => gt.name);
      setSelectedGridType(grid || null);
      if (grid) {
        setGridVariantOptions(grid.variants);
        if (grid.variants.length > 0) {
          setSelectedGridVariant(grid.variants[0]);
        }
      }
    }
  }, [selectedSubCategory, formData.boardType]);

  const findCustomer = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${SERVER_URL}/leads/customers/lookup?phone=${customerPhone}`,
        { method: 'GET' }
      );

      const result = await response.json();

      if (!result.found) {
        Alert.alert('Customer not found', result.message);
        return;
      }

      setCustomerDetails(result.customer_details);

      // Populate formData with customer details
      setFormData(prev => ({
        ...prev,
        fullName: result.customer_details.name,
        phone: customerPhone,
        location: result.customer_details.location,
        district: result.customer_details.district,
        customerProfile: result.customer_details.profile,
        leadSource: result.customer_details.source,
      }));

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to fetch customer');
    } finally {
      setLoading(false);
    }
  };


  // --- API Functions ---
  const fetchMasterData = async () => {
    setIsLoadingMasterData(true);
    try {
      const response = await fetchWithToken(`${SERVER_URL}/master-data`);

      if (!response.ok) {
        throw new Error(`Failed to fetch master data: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setMasterData(data);
      setIsMasterDataLoaded(true);

    } catch (error) {
      console.error('Error fetching master data:', error);
      Alert.alert(
        'Connection Error',
        'Unable to load product data from server. Please check your internet connection and restart the app.',
        [{ text: 'OK' }]
      );
      // Don't set default data - require backend connection for accurate data
    } finally {
      setIsLoadingMasterData(false);
    }
  };

  // Set navigation ref in use Effect
  useEffect(() => {
    setNavigationRef(navigation);
  }, [navigation]);

  const sendToCustomer = async () => {
    try {
      setLoading(true);

      if (!customerId) {
        Alert.alert('Error', 'No lead ID found. Please generate quotation first.');
        return;
      }

      // Prepare payload matching SendQuotationToCustomerRequest schema
      const payload = {
        lead_id: customerId, // Using stored lead_code
        method: 'WhatsApp',
        sent_at: new Date().toISOString()
      };

      console.log('Sending to customer:', payload);

      const response = await fetch(
        `${SERVER_URL}/quotations/send-customer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Send Customer API Error:', errorData);
        throw new Error(errorData?.detail || 'Failed to send quotation to customer');
      }

      const result = await response.json();
      console.log('Send customer response:', result);

      Alert.alert('Success', result.message || 'Quotation sent to customer successfully!');

    } catch (error: any) {
      console.error('Send to Customer Error:', error);
      Alert.alert('Error', error.message || 'Failed to send quotation to customer');
    } finally {
      setLoading(false);
    }
  };


  const sendToApprover = async () => {
    try {
      setLoading(true);
      const lead_end = new Date().toISOString();
      const quote_end = new Date().toISOString();
      const approve_request_at = new Date().toISOString();

      setTimeLogs(prev => ({
        ...prev,
        leadEnd: lead_end,
        quoteEnd: quote_end,
        approverStart: approve_request_at
      }));
      // First, generate the quotation to get lead_code and quotation_id
      const quotationResult = await generateQuotation();

      if (!quotationResult || !quotationResult.lead_code || !quotationResult.qoutaion_id) {
        throw new Error('Failed to generate quotation or missing required IDs');
      }

      // Prepare approval payload matching SubmitQuotationApprovalToTeamLead schema
      const approvalPayload = {
        lead_id: quotationResult.lead_code,
        quotation_id: quotationResult.qoutaion_id,
        sent_at: new Date().toISOString()
      };

      console.log('Submitting for approval:', approvalPayload);

      const response = await fetch(
        `${SERVER_URL}/quotations/submit-quotation-approval`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(approvalPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Approval API Error:', errorData);
        throw new Error(errorData?.detail || 'Failed to submit for approval');
      }

      const result = await response.json();
      console.log('Approval response:', result);

      Alert.alert('Success', result.message || 'Quotation sent to approver for review!');

    } catch (error: any) {
      console.error('Send to Approver Error:', error);
      Alert.alert('Error', error.message || 'Failed to send for approval');
    } finally {
      setLoading(false);
    }
  };


  const updateField = (key: keyof FormData | string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value } as FormData));

    // Update related selections when project type changes
    if (key === 'projectType' && masterData) {
      const category = masterData.categories.find(cat => cat.name === value);
      setSelectedCategory(category || null);
      if (category) {
        const boardTypes = category.sub_categories.map(sub => sub.name);
        setBoardTypeOptions(boardTypes);
        // Reset dependent selections
        updateField('boardType', '');
        updateField('brand', '');
        updateField('channelType', '');
      }
    }

    // Update related selections when board type changes
    if (key === 'boardType' && selectedCategory) {
      const subCategory = selectedCategory.sub_categories.find(sub => sub.name === value);
      setSelectedSubCategory(subCategory || null);
      if (subCategory) {
        const brands = subCategory.Suggested_product.map(product => product.name);
        setBrandOptions(brands);
        const channels = subCategory.channel.map(ch => ch.name);
        setChannelOptions(channels);
        const gridTypes = subCategory.gridtype.map(grid => grid.name);
        setGridTypeOptions(gridTypes);
        setAccessoryOptions(subCategory.accessories);
        // Reset dependent selections
        updateField('brand', '');
        updateField('channelType', '');
      }
    }

    // Update related selections when brand changes
    if (key === 'brand' && selectedSubCategory) {
      const product = selectedSubCategory.Suggested_product.find(p => p.name === value);
      setSelectedSuggestedProduct(product || null);
    }
  };

  // Helper to find material from master data
  const findMaterialFromMaster = (boardType: string, brand: string): Material | undefined => {
    if (!masterData) return undefined;

    return masterData.materials.find(item => {
      const nameMatch = item.name.toLowerCase().includes(boardType.toLowerCase());
      const brandMatch = item.brand === brand;
      return nameMatch && brandMatch;
    }) || masterData.materials[0];
  };

  // Helper to find accessory from master data
  const findAccessoryFromMaster = (accessoryName: string): Accessory | undefined => {
    if (!masterData) return undefined;

    return masterData.accessories.find(item =>
      item.name.toLowerCase().includes(accessoryName.toLowerCase())
    ) || masterData.accessories[0];
  };

  // Helper to get accessory variants
  const getAccessoryVariants = (accessoryName: string): AccessoryVariant[] => {
    if (!selectedSubCategory) return [];

    const accessory = selectedSubCategory.accessories.find(acc => acc.name === accessoryName);
    return accessory ? accessory.variants : [];
  };

  // Helper to add material item
  const addMaterial = () => {
    if (materialQty && formData.boardType && formData.brand) {
      const materialInfo = findMaterialFromMaster(formData.boardType, formData.brand);

      const price = materialInfo?.price || 0;
      const newMaterial: MaterialItem = {
        id: Date.now(),
        name: formData.boardType,
        qty: materialQty,
        price: `₹${price}`,
        total: parseInt(materialQty, 10) * price,
        brand: formData.brand,
        unit: materialInfo?.unit || 'per sheet',
      };
      const updated = [...materialList, newMaterial];
      setMaterialList(updated);
      setFormData(prev => ({
        ...prev,
        materialList: updated,
      }));
      setMaterialQty('');
      setMaterialPrice('');
    } else {
      Alert.alert('Input Missing', 'Please select material type, brand and enter quantity.');
    }
  };

  const removeMaterial = (index: number) => {
    const newList = [...materialList];
    newList.splice(index, 1);
    setMaterialList(newList);
    setFormData(prev => ({ ...prev, materialList: newList }));
  };

  // Helper to add accessory
  const addAccessory = () => {
    if (selectedAccessory && accessoryQty) {
      const accessoryInfo = findAccessoryFromMaster(selectedAccessory);
      const price = accessoryInfo?.price || 0;

      const newAccessory: AccessoryItem = {
        id: Date.now(),
        name: selectedAccessory,
        qty: accessoryQty,
        price: `₹${price}`,
        total: parseInt(accessoryQty, 10) * price,
        unit: accessoryInfo?.unit || 'unit',
      };
      const updated = [...accessoriesList, newAccessory];
      setAccessoriesList(updated);
      setFormData(prev => ({ ...prev, accessoryList: updated }));
      setSelectedAccessory('');
      setAccessoryQty('');
      setAccessoryPrice('');
      setShowAccessoryDropdown(false);
    } else {
      Alert.alert('Input Missing', 'Please select an accessory and enter quantity.');
    }
  };

  const removeAccessory = (index: number) => {
    const newList = [...accessoriesList];
    newList.splice(index, 1);
    setAccessoriesList(newList);
    setFormData(prev => ({ ...prev, accessoryList: newList }));
  };

  const calculateCosts = () => {
    setLoading(true);

    // Calculate from manual lists if in material mode
    if (isMaterialMode && (materialList.length > 0 || accessoriesList.length > 0)) {
      const materialTotal = materialList.reduce((acc, item) => acc + item.total, 0);
      const accessoryTotal = accessoriesList.reduce((acc, item) => acc + item.total, 0);
      const subtotal = materialTotal + accessoryTotal;
      const tax = subtotal * 0.15;
      const finalTotal = subtotal + tax;

      const breakdown: CostDetail[] = [
        ...materialList.map(item => ({
          item: item.name,
          qty: `${item.qty} pcs`,
          price: item.price,
          total: item.total,
        })),
        ...accessoriesList.map(item => ({
          item: item.name,
          qty: `${item.qty} pcs`,
          price: item.price,
          total: item.total,
        })),
      ];

      setFormData((prev) => ({ ...prev, costDetails: breakdown, totalCost: finalTotal }));
      setLoading(false);
      setCurrentStep(5);
      return;
    }

    // Original calculation for non-material mode
    setTimeout(() => {
      const area = parseFloat(formData.areaSqft) || 0;
      const sheetsNeeded = Math.ceil(area / 30);
      const sheetPrice = selectedSuggestedProduct ? parseInt(selectedSuggestedProduct.price) : 550;
      const brandPremium = formData.brand === 'SheetRock' ? 5000 : 2000;
      const channelCost = area * 12;

      const breakdown = [
        {
          item: formData.boardType,
          qty: `${sheetsNeeded} Sheets`,
          price: `₹${sheetPrice}`,
          total: sheetsNeeded * sheetPrice,
        },
        {
          item: `${formData.brand} Premium`,
          qty: 'Lumpsum',
          price: '-',
          total: brandPremium,
        },
        {
          item: `${formData.channelType} ${selectedChannelVariant?.variant || ''}`,
          qty: `${area} ft`,
          price: '₹12/ft',
          total: channelCost,
        },
      ];

      const subtotal = breakdown.reduce((acc, item) => acc + item.total, 0);
      const tax = subtotal * 0.15;
      const finalTotal = subtotal + tax;

      setFormData((prev) => ({ ...prev, costDetails: breakdown, totalCost: finalTotal }));
      setLoading(false);
      setCurrentStep(5);
    }, 800);
  };

  // --- Reusable Toggle Switch Component ---
  const MovableSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onValueChange(!value)}
      style={[
        styles.switchTrack,
        { backgroundColor: value ? '#004aad' : '#E2E8F0' },
      ]}>
      <View
        style={[
          styles.switchThumb,
          { transform: [{ translateX: value ? 20 : 2 }] },
        ]}
      />
    </TouchableOpacity>
  );

  // --- Sheet Modal Component ---
  const SheetModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSheetModal}
      onRequestClose={() => setShowSheetModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Material & Accessories Price List</Text>
            <TouchableOpacity
              onPress={() => setShowSheetModal(false)}
              style={styles.modalCloseBtn}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Materials Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Materials Price List</Text>
              {masterData && masterData.materials.length > 0 ? (
                <View style={styles.sheetTable}>
                  <View style={styles.sheetTableHeader}>
                    <Text style={[styles.sheetTh, styles.sheetCol1]}>MATERIAL</Text>
                    <Text style={[styles.sheetTh, styles.sheetCol2]}>BRAND</Text>
                    <Text style={[styles.sheetTh, styles.sheetCol3]}>PRICE</Text>
                    <Text style={[styles.sheetTh, styles.sheetCol4]}>UNIT</Text>
                  </View>
                  {masterData.materials.map((item, idx) => (
                    <View key={item.id || idx} style={styles.sheetTableRow}>
                      <Text style={[styles.sheetTd, styles.sheetCol1]}>{item.name}</Text>
                      <Text style={[styles.sheetTd, styles.sheetCol2, styles.sheetTdCenter]}>{item.brand}</Text>
                      <Text style={[styles.sheetTd, styles.sheetCol3, styles.sheetTdCenter]}>₹{item.price}</Text>
                      <Text style={[styles.sheetTd, styles.sheetCol4, styles.sheetTdCenter]}>{item.unit}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No materials data available</Text>
              )}
            </View>

            {/* Accessories Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Accessories Price List</Text>
              {masterData && masterData.accessories.length > 0 ? (
                <View style={styles.sheetTable}>
                  <View style={styles.sheetTableHeader}>
                    <Text style={[styles.sheetTh, styles.sheetCol1Accessory]}>ACCESSORY</Text>
                    <Text style={[styles.sheetTh, styles.sheetCol2Accessory]}>PRICE</Text>
                    <Text style={[styles.sheetTh, styles.sheetCol3Accessory]}>UNIT</Text>
                  </View>
                  {masterData.accessories.map((item, idx) => (
                    <View key={item.id || idx} style={styles.sheetTableRow}>
                      <Text style={[styles.sheetTd, styles.sheetCol1Accessory]}>{item.name}</Text>
                      <Text style={[styles.sheetTd, styles.sheetCol2Accessory, styles.sheetTdCenter]}>₹{item.price}</Text>
                      <Text style={[styles.sheetTd, styles.sheetCol3Accessory, styles.sheetTdCenter]}>{item.unit}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No accessories data available</Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalDoneBtn}
            onPress={() => setShowSheetModal(false)}>
            <Text style={styles.modalDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Show loading indicator while fetching master data
  if (isLoadingMasterData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004aad" />
          <Text style={styles.loadingText}>Loading master data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Functions ---

  // 1. CUSTOMER CARD (At the top)
  const renderCustomerCard = () => (
    <View style={styles.card}>
      <Text style={styles.headerLg}>Customer Details</Text>

      {/* Phone input + Find button */}
      <View style={styles.phoneRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter 10 digit number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />
        </View>

        <TouchableOpacity
          style={styles.findBtn}
          onPress={findCustomer}
          disabled={customerPhone.length !== 10 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.findBtnText}>Find</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Customer info */}
      {customerDetails && (
        <>
          <View style={styles.divider} />

          <View style={styles.customerInfoRow}>
            <Icon name="account" size={18} color="#004aad" />
            <Text style={styles.customerInfoText}>
              {customerDetails.name}
            </Text>
          </View>

          <View style={styles.customerInfoRow}>
            <Icon name="map-marker" size={18} color="#004aad" />
            <Text style={styles.customerInfoSub}>
              {customerDetails.location}, {customerDetails.district}
            </Text>
          </View>

          <View style={styles.customerInfoRow}>
            <Icon name="briefcase" size={18} color="#004aad" />
            <Text style={styles.customerInfoSub}>
              {customerDetails.profile}
            </Text>
          </View>
        </>
      )}
    </View>
  );


  // STEP 3: SPECS (Updated with material mode features)
  const renderStep3 = () => (
    <View style={styles.card}>
      <View style={styles.stepHeaderContainer}>
        <Text style={styles.headerLg}>Project Specs</Text>
        <View style={styles.stepSwitchRow}>
          <Text style={styles.stepIndicator}>Step 1 of 4</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Material Mode</Text>
            <MovableSwitch
              value={isMaterialMode}
              onValueChange={setIsMaterialMode}
            />
          </View>
        </View>
      </View>

      {!isMaterialMode && (
        <View style={{ marginBottom: 25 }}>
          <Text style={styles.label}>Total Area</Text>
          <View style={styles.areaInputWrapper}>
            <TextInput
              style={styles.areaInput}
              placeholder="0"
              placeholderTextColor="#999999"
              keyboardType="numeric"
              value={formData.areaSqft}
              onChangeText={(t) => updateField('areaSqft', t)}
            />
            <Text style={styles.unitText}>Sq.ft</Text>
          </View>
        </View>
      )}

      <View>
        <Text style={styles.label}>Project Type</Text>
        <View style={styles.gridContainer}>
          {projectTypeOptions.map((type, index) => (
            <SelectionBox
              key={index}
              label={type}
              icon={type.includes('Ceiling') ? 'ceiling-light' : 'wall'}
              selected={formData.projectType === type}
              onPress={() => updateField('projectType', type)}
              fullWidth={false}
            />
          ))}
        </View>
      </View>

      <View style={styles.buttonSpacing} />
      {customerDetails && (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setCurrentStep(4)}
          disabled={!isMasterDataLoaded}>
          <Text style={styles.primaryBtnText}>Next: Select Materials</Text>
          <Icon name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  // STEP 4: MATERIALS (Updated with cost list and sheet button)
  const renderStep4 = () => (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerLg}>Materials Selection</Text>
        <Text style={styles.stepIndicator}>Step 2 of 4</Text>
      </View>

      {/* Board Type Dropdown */}
      <Text style={styles.label}>Board Type</Text>
      <TouchableOpacity
        style={styles.pickerBox}
        onPress={() => setShowBoardTypeDropdown(!showBoardTypeDropdown)}
        disabled={!isMasterDataLoaded || !selectedCategory}>
        <Text style={styles.pickerText}>
          {formData.boardType || 'Select Board Type'}
        </Text>
        <Icon
          name={showBoardTypeDropdown ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={isMasterDataLoaded && selectedCategory ? '#004aad' : '#cccccc'}
        />
      </TouchableOpacity>

      {showBoardTypeDropdown && boardTypeOptions.length > 0 && (
        <View style={styles.dropdownList}>
          {boardTypeOptions.map((boardType, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dropdownItem,
                idx === boardTypeOptions.length - 1 && {
                  borderBottomWidth: 0,
                },
              ]}
              onPress={() => {
                updateField('boardType', boardType);
                setShowBoardTypeDropdown(false);
              }}>
              <Icon
                name={
                  boardType.includes('Grid')
                    ? 'grid'
                    : boardType.includes('POP')
                      ? 'brush'
                      : 'view-grid'
                }
                size={18}
                color="#004aad"
                style={{ marginRight: 10 }}
              />
              <Text
                style={[
                  styles.dropdownItemText,
                  formData.boardType === boardType && {
                    color: '#004aad',
                    fontWeight: '600',
                  },
                ]}>
                {boardType}
              </Text>
              {formData.boardType === boardType && (
                <Icon name="check" size={18} color="#004aad" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}



      {/* Brand Preference */}
      <Text style={styles.label}>Brand Preference</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}>
        {brandOptions.map((brand, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.chip, formData.brand === brand && styles.chipActive]}
            onPress={() => updateField('brand', brand)}
            disabled={!isMasterDataLoaded || !selectedSubCategory}>
            <Text
              style={[
                styles.chipText,
                formData.brand === brand && styles.chipTextActive,
              ]}>
              {brand}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Channels Selection */}
      {channelOptions.length > 0 && (
        <>
          <Text style={styles.label}>Channels</Text>
          <View style={styles.chipGrid}>
            {channelOptions.map((channel, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.chip,
                  formData.channelType === channel && styles.chipActive,
                ]}
                onPress={() => updateField('channelType', channel)}
                disabled={!isMasterDataLoaded || !selectedSubCategory}>
                <Text
                  style={[
                    styles.chipText,
                    formData.channelType === channel && styles.chipTextActive,
                  ]}>
                  {channel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Thickness Selection (if available from channel variants) */}
      {channelVariantOptions.length > 0 && (
        <>
          <Text style={styles.label}>Thickness</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {channelVariantOptions.map((variant, index) => {
              // Same pattern as NewLeadScreen
              const optionValue = `${variant.brand} ${variant.variant}`;

              return (
                <TouchableOpacity
                  key={`${optionValue}-${index}`}   // ✅ UNIQUE KEY
                  style={[
                    styles.chip,
                    formData.thickness === optionValue && styles.chipActive,
                  ]}
                  onPress={() => updateField('thickness', optionValue)}
                  disabled={!isMasterDataLoaded}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.thickness === optionValue && styles.chipTextActive,
                    ]}
                  >
                    {optionValue}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </>
      )}

      {/* --- FOLLOW-UP URGENCY (Scrollable like Thickness) --- */}
      <Text style={styles.label}>Follow-up Urgency</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
      >
        {([
          { label: 'Immediate', color: '#dc3545', icon: 'alert-circle' },
          { label: 'In a week', color: '#fd7e14', icon: 'calendar-week' },
          { label: 'In a month', color: '#198754', icon: 'calendar-month' },
          { label: 'Not required', color: '#6c757d', icon: 'clock-outline' },
        ] as const).map((item) => {
          const isActive = formData.urgency === item.label;

          return (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isActive && { backgroundColor: item.color },
              ]}
              onPress={() => updateField('urgency', item.label)}
            >
              <Icon
                name={item.icon}
                size={16}
                color={isActive ? '#fff' : '#666'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>


      {/* --- MATERIAL MODE SECTION --- */}
      {isMaterialMode && (
        <View style={styles.materialModeSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.label, { marginBottom: 0 }]}>
              Material Pieces
            </Text>
            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => setShowSheetModal(true)}
              disabled={!isMasterDataLoaded}>
              <Icon name="file-table" size={18} color="#fff" />
              <Text style={styles.sheetBtnText}>Sheet</Text>
            </TouchableOpacity>
          </View>

          {/* Material Info Display */}
          <View style={styles.materialInfoBox}>
            <View style={styles.materialInfoRow}>
              <Icon name="view-grid" size={16} color="#004aad" />
              <Text style={styles.materialInfoText}>
                Selected Material: <Text style={styles.boldText}>{formData.boardType}</Text>
              </Text>
            </View>
            <View style={styles.materialInfoRow}>
              <Icon name="tag" size={16} color="#004aad" />
              <Text style={styles.materialInfoText}>
                Selected Brand: <Text style={styles.boldText}>{formData.brand}</Text>
              </Text>
            </View>
            {selectedSuggestedProduct && (
              <View style={styles.materialInfoRow}>
                <Icon name="currency-inr" size={16} color="#004aad" />
                <Text style={styles.materialInfoText}>
                  Price Range: <Text style={styles.boldText}>{selectedSuggestedProduct.price_bar}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Material Input - Equal Width Qty & Price */}
          <View style={styles.equalWidthInputRow}>
            <View style={styles.equalWidthInputGroup}>
              <Text style={styles.inputLabelSmall}>Quantity</Text>
              <TextInput
                style={styles.equalWidthInput}
                placeholder="Enter qty"
                keyboardType="numeric"
                value={materialQty}
                onChangeText={(text) => {
                  setMaterialQty(text);
                  if (text && formData.boardType && formData.brand) {
                    const material = findMaterialFromMaster(formData.boardType, formData.brand);
                    setMaterialPrice(material?.price?.toString() || '0');
                  }
                }}
                editable={isMasterDataLoaded}
              />
            </View>

            <View style={styles.equalWidthInputGroup}>
              <Text style={styles.inputLabelSmall}>Price</Text>
              <TextInput
                style={[styles.equalWidthInput, styles.priceInput]}
                placeholder="₹"
                keyboardType="numeric"
                value={materialPrice}
                onChangeText={setMaterialPrice}
                editable={false}
              />
            </View>

            <View style={styles.roundButtonContainer}>
              <Text style={styles.inputLabelSmall}>&nbsp;</Text>
              <TouchableOpacity
                style={[
                  styles.roundAddButton,
                  (!materialQty || !materialPrice || !isMasterDataLoaded) && styles.roundButtonDisabled
                ]}
                onPress={addMaterial}
                disabled={!materialQty || !materialPrice || !isMasterDataLoaded}>
                <Icon name="plus" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Materials List */}
          {materialList.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Material List</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.tableCol1]}>MATERIAL</Text>
                  <Text style={[styles.th, styles.tableCol2]}>BRAND</Text>
                  <Text style={[styles.th, styles.tableCol3]}>QTY</Text>
                  <Text style={[styles.th, styles.tableCol4]}>PRICE</Text>
                  <Text style={[styles.th, styles.tableCol5]}>TOTAL</Text>
                  <Text style={[styles.th, styles.tableCol6]}>ACTION</Text>
                </View>
                {materialList.map((item, idx) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tdTitle, styles.tableCol1]}>{formData.boardType}</Text>
                    <Text style={[styles.tdSub, styles.tableCol2]}>{formData.brand}</Text>
                    <Text style={[styles.tdSub, styles.tableCol3]}>{item.qty} pcs</Text>
                    <Text style={[styles.tdSub, styles.tableCol4]}>₹{item.price.replace('₹', '')}</Text>
                    <Text style={[styles.tdPrice, styles.tableCol5]}>₹{item.total}</Text>
                    <TouchableOpacity
                      onPress={() => removeMaterial(idx)}
                      style={styles.tableCol6}>
                      <Icon name="trash-can-outline" size={16} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Accessories Section */}
          <Text style={[styles.label, styles.sectionSpacing]}>
            Accessories
          </Text>

          {/* Row 1: Accessory Selection */}
          <View style={styles.accessorySelectionRow}>
            <View style={styles.accessoryPickerContainer}>
              <Text style={styles.inputLabelSmall}>Select Accessory</Text>
              <TouchableOpacity
                style={styles.accessoryPickerBox}
                onPress={() => setShowAccessoryDropdown(!showAccessoryDropdown)}
                disabled={!isMasterDataLoaded || !selectedSubCategory}>
                <Text style={styles.accessoryPickerText}>
                  {selectedAccessory || 'Select Accessory'}
                </Text>
                <Icon
                  name={showAccessoryDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isMasterDataLoaded && selectedSubCategory ? '#666' : '#cccccc'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dropdown List */}
          {showAccessoryDropdown && accessoryOptions.length > 0 && (
            <View style={styles.accessoryDropdownContainer}>
              <ScrollView
                style={styles.accessoryDropdownScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                {accessoryOptions.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.accessoryDropdownItem}
                    onPress={() => {
                      setSelectedAccessory(item.name);
                      setShowAccessoryDropdown(false);
                      const accessory = findAccessoryFromMaster(item.name);
                      if (accessory && accessoryQty) {
                        setAccessoryPrice(accessory.price.toString());
                      }
                    }}>
                    <Text style={styles.accessoryDropdownItemText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Row 2: Equal Width Qty & Price with Round Button */}
          <View style={styles.equalWidthInputRow}>
            <View style={styles.equalWidthInputGroup}>
              <Text style={styles.inputLabelSmall}>Quantity</Text>
              <TextInput
                style={styles.equalWidthInput}
                placeholder="Enter qty"
                keyboardType="numeric"
                value={accessoryQty}
                onChangeText={(text) => {
                  setAccessoryQty(text);
                  if (text && selectedAccessory) {
                    const accessory = findAccessoryFromMaster(selectedAccessory);
                    setAccessoryPrice(accessory?.price?.toString() || '0');
                  }
                }}
                editable={isMasterDataLoaded}
              />
            </View>

            <View style={styles.equalWidthInputGroup}>
              <Text style={styles.inputLabelSmall}>Price</Text>
              <TextInput
                style={[styles.equalWidthInput, styles.priceInput]}
                placeholder="₹"
                keyboardType="numeric"
                value={accessoryPrice}
                onChangeText={setAccessoryPrice}
                editable={false}
              />
            </View>

            <View style={styles.roundButtonContainer}>
              <Text style={styles.inputLabelSmall}>&nbsp;</Text>
              <TouchableOpacity
                style={[
                  styles.roundAddButton,
                  (!selectedAccessory || !accessoryQty || !accessoryPrice || !isMasterDataLoaded) && styles.roundButtonDisabled
                ]}
                onPress={addAccessory}
                disabled={!selectedAccessory || !accessoryQty || !accessoryPrice || !isMasterDataLoaded}>
                <Icon name="plus" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Accessories List */}
          {accessoriesList.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Accessories List</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.tableCol1]}>ACCESSORY</Text>
                  <Text style={[styles.th, styles.tableCol2]}>UNIT</Text>
                  <Text style={[styles.th, styles.tableCol3]}>QTY</Text>
                  <Text style={[styles.th, styles.tableCol4]}>PRICE</Text>
                  <Text style={[styles.th, styles.tableCol5]}>TOTAL</Text>
                  <Text style={[styles.th, styles.tableCol6]}>ACTION</Text>
                </View>
                {accessoriesList.map((item, idx) => {
                  const accessoryInfo = findAccessoryFromMaster(item.name);
                  return (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={[styles.tdTitle, styles.tableCol1]}>{item.name}</Text>
                      <Text style={[styles.tdSub, styles.tableCol2]}>{accessoryInfo?.unit || 'unit'}</Text>
                      <Text style={[styles.tdSub, styles.tableCol3]}>{item.qty}</Text>
                      <Text style={[styles.tdSub, styles.tableCol4]}>₹{item.price.replace('₹', '')}</Text>
                      <Text style={[styles.tdPrice, styles.tableCol5]}>₹{item.total}</Text>
                      <TouchableOpacity
                        onPress={() => removeAccessory(idx)}
                        style={styles.tableCol6}>
                        <Icon name="trash-can-outline" size={16} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* --- NON-MATERIAL MODE ACCESSORIES --- */}
      {!isMaterialMode && (
        <View style={styles.accessoryInfoBox}>
          <View style={styles.accessoryHeader}>
            <Icon name="toolbox" size={16} color="#004aad" />
            <Text style={styles.accessoryTitle}>Accessories</Text>
          </View>
          <Text style={styles.accessoryDescription}>
            Auto-calculated based on selections{'\n'}
            (Screws, Tapes, Joint Compound)
          </Text>
        </View>
      )}

      <View style={styles.buttonSpacing} />
      <TouchableOpacity
        style={[styles.primaryBtn, !isMasterDataLoaded && styles.buttonDisabled]}
        onPress={calculateCosts}
        disabled={!isMasterDataLoaded}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>Calculate Estimation</Text>
            <Icon name="arrow-right" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return null;

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (endTime <= startTime) return null;

    const diffMs = endTime - startTime;

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatTime = (isoString?: string, preview?: boolean) => {
    if (!isoString) return null;
    if (!preview) return false;

    const date = new Date(isoString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert 0 → 12
    const formattedHours = String(hours).padStart(2, '0');
    if (preview) {
      return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }
    else { return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}` }
  };

  const qoutationStartTime = async () => {
    const quoteStart = new Date().toISOString();
    setTimeLogs(prev => ({
      ...prev,
      quoteStart: quoteStart
    }));

    // Actually generate the quotation (calls API)
    await generateQuotation();
  }

  const generateQuotation = async () => {
    if (!customerDetails) {
      Alert.alert('Error', 'Please find customer before generating quotation');
      return;
    }

    try {
      setLoading(true);

      // Prepare payload matching LeadCreateSchema
      const payload = {
        lead_created_at: new Date().toISOString(),
        source: customerDetails.source,
        customer_name: customerDetails.name,
        phone: customerPhone,
        location: customerDetails.location,
        district: customerDetails.district,
        profile: customerDetails.profile,
        area_sqft: Number(formData.areaSqft) || null,
        project_type: formData.projectType,
        board_type: formData.boardType,
        material_brand: formData.brand,
        channel: formData.channelType,
        channel_thickness: formData.tataType,
        material_category: isMaterialMode ? formData.boardType : null,
        material_quantity: isMaterialMode ? Number(materialQty) : null,
        accessory_name: isMaterialMode ? selectedAccessory : null,
        accessory_qty: isMaterialMode ? Number(accessoryQty) : null,
        urgency: formData.urgency || "Normal",
        quotation_created_at: new Date().toISOString(),
        quotation_id: quotationId,
        total_estimated_cost: formData.totalCost ? Number(formData.totalCost) : null,
      };

      console.log('Creating lead with payload:', payload);

      const response = await fetchWithToken(`${SERVER_URL}/leads/create-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData?.detail || 'Failed to create lead');
      }

      const result = await response.json();
      console.log('Lead created successfully:', result);

      // Store lead_code and quotation_id for later use
      setCustomerId(result.lead_code);

      Alert.alert('Success', 'Quotation generated successfully!');
      setCurrentStep(6);
      return result;

    } catch (error: any) {
      console.error('Generate Quotation Error:', error);
      Alert.alert('Error', error.message || 'Unable to generate quotation');
    } finally {
      setLoading(false);
    }
  };


  // STEP 5: ESTIMATE (Updated with material mode support)
  const renderStep5 = () => (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerLg}>Estimation</Text>
        <Text style={styles.stepIndicator}>Step 3 of 4</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>ITEM</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>QTY</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>PRICE</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>COST</Text>
        </View>
        {formData.costDetails.map((item, idx) => (
          <View key={idx} style={styles.tr}>
            <View style={{ flex: 2 }}>
              <Text style={styles.tdTitle}>{item.item}</Text>
            </View>
            <Text style={[styles.tdSub, { flex: 1, textAlign: 'center' }]}>
              {item.qty}
            </Text>
            <Text style={[styles.tdSub, { flex: 1, textAlign: 'center' }]}>
              {item.price}
            </Text>
            <Text style={[styles.tdPrice, { flex: 1, textAlign: 'right' }]}>
              ₹{item.total.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {!isMaterialMode && (
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Area (Sqft)</Text>
            <Text style={styles.summaryValue}>
              {formData.areaSqft} Sqft
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ₹{((formData.totalCost || 0) / 1.15).toFixed(0)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.totalBlock}>
        <View>
          <Text style={styles.totalLabel}>Total Estimate</Text>
          <Text style={styles.gstNote}>(Incl. 15% GST)</Text>
        </View>
        <Text style={styles.totalAmount}>
          ₹{formData.totalCost.toLocaleString()}
        </Text>
      </View>

      <View style={styles.buttonSpacing} />
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => setCurrentStep(4)}>
        <Text style={styles.secondaryBtnText}>Edit Materials</Text>
      </TouchableOpacity>

      <View style={styles.buttonSpacingSmall} />
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={qoutationStartTime}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>Generate Quotation</Text>
            <Icon name="arrow-right" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // STEP 6: PREVIEW (Updated with Send to Approver button)
  const renderStep6 = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Icon name="office-building" size={28} color="#004aad" />
          <View style={styles.previewHeaderContent}>
            <Text style={styles.companyName}>STK Associates</Text>
            <View style={styles.quoteInfo}>
              <Text style={styles.quoteId}>
                Quotation #: {quotationId}
              </Text>
              <Text style={styles.quoteDate}>
                Date: {quotationDate}
              </Text>
            </View>

          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>CUSTOMER DETAILS</Text>
          <Text style={styles.previewValue}>
            Name: {customerDetails?.name || formData.fullName || 'N/A'}
          </Text>
          <Text style={styles.previewSubValue}>
            Phone: {customerPhone || formData.phone || 'N/A'}
          </Text>
          <Text style={styles.previewSubValue}>
            Location: {customerDetails?.location || formData.location || 'N/A'}, {customerDetails?.district || formData.district || 'N/A'}
          </Text>
        </View>

        {/* --- CONDITIONAL PREVIEW --- */}
        {!isMaterialMode ? (
          // STANDARD MODE
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>PROJECT DETAILS</Text>
            <Text style={styles.previewValue}>
              Project Type: {formData.projectType}
            </Text>
            <Text style={styles.previewSubValue}>
              Area: {formData.areaSqft || 'Not specified'} Sqft
            </Text>
            <Text style={styles.previewSubValue}>
              Material: {formData.boardType}, {formData.channelType}
            </Text>
            <Text style={styles.previewSubValue}>
              Brand: {formData.brand}
            </Text>
          </View>
        ) : (
          // MATERIAL MODE PREVIEW
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>DIRECT ORDER</Text>
            <Text style={styles.previewValue}>
              Material: {formData.boardType}
            </Text>
            <Text style={styles.previewSubValue}>
              Brand: {formData.brand}
            </Text>
            {materialList.length > 0 && (
              <View style={styles.accessoryPreviewSection}>
                <Text style={[styles.previewLabel, styles.accessoryPreviewLabel]}>
                  MATERIALS
                </Text>
                {materialList.map((mat, i) => (
                  <Text key={i} style={styles.previewSubValue}>
                    • {mat.name} ({mat.qty} {mat.unit}) - ₹{mat.total}
                  </Text>
                ))}
              </View>
            )}
            {accessoriesList.length > 0 && (
              <View style={styles.accessoryPreviewSection}>
                <Text style={[styles.previewLabel, styles.accessoryPreviewLabel]}>
                  ACCESSORIES
                </Text>
                {accessoriesList.map((acc, i) => (
                  <Text key={i} style={styles.previewSubValue}>
                    • {acc.name} ({acc.qty} {acc.unit}) - ₹{acc.total}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>COST SUMMARY</Text>
          {formData.costDetails.map((item, idx) => (
            <Text key={idx} style={styles.previewSubValue}>
              {item.item}: ₹{item.total.toLocaleString()}
            </Text>
          ))}
        </View>

        <View style={styles.finalTotalRow}>
          <View>
            <Text style={styles.finalTotalLabel}>Total Amount</Text>
            <Text style={styles.finalTotalSubLabel}>(Incl. 15% GST)</Text>
          </View>
          <Text style={styles.finalTotalValue}>
            ₹{(formData.totalCost || 0).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.timestampCard}>

        {/* ===== Lead Timestamp ===== */}
        <Text style={styles.timestampHeader}>Lead Timestamp</Text>

        <View style={styles.timestampRow}>
          <Text style={styles.timestampLabel}>Started At:</Text>
          <Text style={styles.timestampValue}>
            {formatTime(timeLogs.leadStart, true) || '--'}
          </Text>
        </View>

        <View style={styles.timestampRow}>
          <Text style={styles.timestampLabel}>Ended At:</Text>
          <Text style={styles.timestampValue}>
            {formatTime(timeLogs.leadEnd, true) || 'Click Send to Approver'}
          </Text>
        </View>

        <Text style={styles.timestampHeader}>Time Taken</Text>

        <View style={styles.timestampRow}>
          <Text style={styles.timeTakenValue}>
            {calculateDuration(timeLogs.leadStart, timeLogs.leadEnd) || '--'}
          </Text>
        </View>

        {/* ===== Quotation Timestamp ===== */}
        <Text style={[styles.timestampHeader, { marginTop: 16 }]}>
          Quotation Timestamp
        </Text>

        <View style={styles.timestampRow}>
          <Text style={styles.timestampLabel}>Started At:</Text>
          <Text style={styles.timestampValue}>
            {formatTime(timeLogs.quoteStart, true) || '--'}
          </Text>
        </View>

        <View style={styles.timestampRow}>
          <Text style={styles.timestampLabel}>Ended At:</Text>
          <Text style={styles.timestampValue}>
            {formatTime(timeLogs.quoteEnd, true) || 'Click Send to Approver'}
          </Text>
        </View>

        <Text style={styles.timestampHeader}>Time Taken</Text>

        <View style={styles.timestampRow}>
          <Text style={styles.timeTakenValue}>
            {calculateDuration(timeLogs.quoteStart, timeLogs.quoteEnd) || '--'}
          </Text>
        </View>

      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => { }}>
        <Icon name="file-pdf-box" size={20} color="#fff" />
        <Text style={styles.actionBtnText}>Download PDF</Text>
      </TouchableOpacity>

      <View style={styles.buttonSpacingSmall} />
      <TouchableOpacity
        style={styles.whatsappBtn}
        disabled={loading}
        onPress={sendToCustomer}
      >
        <Icon name="whatsapp" size={20} color="#fff" />
        <Text style={styles.actionBtnText}>Send via WhatsApp</Text>
      </TouchableOpacity>


      <View style={styles.buttonSpacingSmall} />
      <TouchableOpacity
        style={styles.approverBtn}
        disabled={loading}
        onPress={sendToApprover}
      >
        <Icon name="shield-check-outline" size={20} color="#fff" />
        <Text style={styles.actionBtnText}>Send to Approver</Text>
      </TouchableOpacity>


      <View style={styles.buttonSpacingSmall} />
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => { }}>
        <Icon name="email-outline" size={18} color="#004aad" />
        <Text style={styles.secondaryBtnText}>Send via Email</Text>
      </TouchableOpacity>
    </View>
  );

  // MAIN RENDER
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Navigation & Progress */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() =>
            currentStep > 3
              ? setCurrentStep(currentStep - 1)
              : navigation?.goBack()
          }
          style={styles.navBtn}>
          <Icon name="chevron-left" size={28} color="#004aad" />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>
            {currentStep === 3 && 'Project Specs'}
            {currentStep === 4 && 'Materials Selection'}
            {currentStep === 5 && 'Estimation'}
            {currentStep === 6 && 'Quote Preview'}
          </Text>
          <Text style={styles.navSubtitle}>
            Step {currentStep - 2} of 4
          </Text>
        </View>
        <View style={styles.navBtn} />
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentStep - 2) / 4) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* CUSTOMER CARD (Always at the top) */}
        {renderCustomerCard()}

        {/* Dynamic Steps */}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </ScrollView>

      {/* Sheet Modal */}
      <SheetModal />
    </SafeAreaView>
  );
};

// --- Reusable Components ---
const InputGroup: React.FC<{
  label: string;
  placeholder?: string;
  value: string;
  onChange: (t: string) => void;
  keyboardType?: any;
}> = ({ label, placeholder, value, onChange, keyboardType }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>
      <Icon
        name={
          label.includes('Name')
            ? 'account'
            : label.includes('Phone')
              ? 'phone'
              : label.includes('Location')
                ? 'map-marker'
                : 'text'
        }
        size={14}
        color="#004aad"
        style={styles.inputIcon}
      />
      {label}
    </Text>
    <View style={styles.inputField}>
      <TextInput
        style={styles.inputText}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

const SelectionBox: React.FC<{
  label: string;
  icon: string;
  selected?: boolean;
  onPress?: () => void;
  fullWidth?: boolean;
}> = ({ label, icon, selected, onPress, fullWidth }) => (
  <TouchableOpacity
    style={[
      styles.selectBox,
      fullWidth ? styles.selectBoxFull : styles.selectBoxHalf,
      selected && styles.selectBoxActive,
    ]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Icon name={icon} size={32} color={selected ? '#004aad' : '#666666'} />
    <Text style={[styles.selectText, selected && styles.selectTextActive]}>
      {label}
    </Text>
    {selected && (
      <View style={styles.selectCheckIcon}>
        <Icon name="check-circle" size={18} color="#004aad" />
      </View>
    )}
  </TouchableOpacity>
);

// --- Styles ---
const styles = StyleSheet.create({
  // === Background & Layout ===
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  previewContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // === Equal Width Input Row ===
  equalWidthInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  equalWidthInputGroup: {
    flex: 1,
  },
  equalWidthInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  roundButtonContainer: {
    width: 44,
    alignItems: 'center',
  },
  roundAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#004aad',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  roundButtonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: '#999',
  },

  // === Material Info Box ===
  materialInfoBox: {
    backgroundColor: '#e6f0ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d0e0ff',
  },
  materialInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  materialInfoText: {
    fontSize: 13,
    color: '#002d69',
    marginLeft: 8,
    fontWeight: '400',
  },
  boldText: {
    fontWeight: '600',
  },

  // === Price Input ===
  priceInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },

  // === Accessories Section Styles ===
  accessorySelectionRow: {
    marginBottom: 12,
  },
  accessoryPickerContainer: {
    flex: 1,
  },
  accessoryPickerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  accessoryPickerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },

  // Dropdown Container
  accessoryDropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    maxHeight: 150,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accessoryDropdownScroll: {
    maxHeight: 148,
  },
  accessoryDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accessoryDropdownItemText: {
    fontSize: 14,
    color: '#333',
  },

  // === Existing styles to keep ===
  materialModeSection: {
    marginTop: 16,
  },
  sectionSpacing: {
    marginTop: 15,
  },
  listContainer: {
    marginTop: 16,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#002d69',
    marginBottom: 8,
  },
  inputLabelSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#002d69',
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sheetBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    shadowColor: '#999',
  },

  // === Navigation Bar ===
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
  },
  navBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002d69',
  },
  navSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },

  // === Progress Bar ===
  progressContainer: {
    height: 3,
    backgroundColor: '#e6f0ff',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#004aad',
  },

  // === Main Card Container ===
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#002d69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e6f0ff',
  },

  // === Typography ===
  headerContainer: {
    marginBottom: 16,
  },
  headerLg: {
    fontSize: 20,
    fontWeight: '700',
    color: '#002d69',
  },
  stepIndicator: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },

  // === Customer Card Specifics ===
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customerNameValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#002d69',
  },
  idInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 120,
    fontSize: 16,
    color: '#002d69',
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  // === Labels ===
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d69',
    marginBottom: 8,
    marginTop: 10,
  },

  // === Inputs ===
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#002d69',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 6,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    fontWeight: '400',
  },

  // === Table Columns ===
  tableCol1: { flex: 2 },
  tableCol2: { flex: 1.5, textAlign: 'center' },
  tableCol3: { flex: 1, textAlign: 'center' },
  tableCol4: { flex: 1, textAlign: 'center' },
  tableCol5: { flex: 1, textAlign: 'center' },
  tableCol6: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
  },
  pickerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cccccc',
    height: 48,
  },
  pickerText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '400',
  },

  // === Buttons & Spacing ===
  buttonSpacing: {
    height: 20,
  },
  buttonSpacingSmall: {
    height: 12,
  },
  primaryBtn: {
    backgroundColor: '#004aad',
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#004aad',
    flexDirection: 'row',
  },
  secondaryBtnText: {
    color: '#004aad',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  whatsappBtn: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  approverBtn: {
    backgroundColor: '#6f42c1',
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6f42c1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // === Grid / Selection Cards ===
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  selectBox: {
    height: 100,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  selectBoxHalf: {
    width: '48%',
  },
  selectBoxFull: {
    width: '100%',
  },
  selectBoxActive: {
    backgroundColor: '#e6f0ff',
    borderWidth: 2,
    borderColor: '#004aad',
  },
  selectText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  selectTextActive: {
    color: '#004aad',
    fontWeight: '600',
  },
  selectCheckIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // === Area Input ===
  areaInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    height: 48,
    borderWidth: 1,
    borderColor: '#cccccc',
    paddingHorizontal: 12,
  },
  areaInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#002d69',
    height: '100%',
    paddingVertical: 12,
    paddingRight: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  unitText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },

  // === Switch ===
  stepHeaderContainer: {
    marginBottom: 20,
  },
  stepSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#002d69',
    fontWeight: '600',
    marginRight: 8,
  },
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    elevation: 2,
  },

  // === Chips ===
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  chipActive: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  chipTextActive: {
    color: '#fff',
  },

  accessoryInfoBox: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  accessoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  accessoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#002d69',
    marginLeft: 6,
  },
  accessoryDescription: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 16,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cccccc',
    marginBottom: 12,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#333333',
    flex: 1,
  },

  // === Table ===
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e6f0ff',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e6f0ff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#d0e0ff',
  },
  th: {
    fontSize: 11,
    color: '#002d69',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tdTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d69',
  },
  tdSub: {
    fontSize: 12,
    color: '#666666',
  },
  tdPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d69',
  },

  // === Summary Box ===
  summaryBox: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#002d69',
    fontWeight: '600',
  },

  // === Total Block ===
  totalBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#002d69',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  gstNote: {
    fontSize: 11,
    color: '#a0c0ff',
    marginTop: 3,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },

  // === Preview Card ===
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#002d69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e6f0ff',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
    paddingBottom: 16,
  },
  previewHeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002d69',
  },
  quoteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  quoteId: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },
  quoteDate: {
    fontSize: 11,
    color: '#666666',
  },
  previewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: 15,
    color: '#002d69',
    fontWeight: '600',
    marginBottom: 2,
  },
  previewSubValue: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  accessoryPreviewSection: {
    marginTop: 10,
  },
  accessoryPreviewLabel: {
    marginTop: 5,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    padding: 14,
    borderRadius: 8,
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d69',
  },
  finalTotalSubLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#666666',
    marginTop: 2,
  },
  finalTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#004aad',
  },

  // === Modal Styles ===
  sheetTable: {
    borderWidth: 1,
    borderColor: '#e6f0ff',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  sheetTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e6f0ff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d0e0ff',
  },
  sheetTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
    alignItems: 'center',
    minHeight: 44,
  },
  sheetTh: {
    fontSize: 10,
    color: '#002d69',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sheetTd: {
    fontSize: 12,
    color: '#333333',
  },
  sheetTdCenter: {
    textAlign: 'center',
  },

  // Materials Table Columns
  sheetCol1: { flex: 3 },    // Material Name
  sheetCol2: { flex: 1.5 },  // Brand
  sheetCol3: { flex: 1 },    // Price
  sheetCol4: { flex: 1.5 },  // Unit

  // Accessories Table Columns
  sheetCol1Accessory: { flex: 3 },   // Accessory Name
  sheetCol2Accessory: { flex: 1 },   // Price
  sheetCol3Accessory: { flex: 2 },   // Unit

  // === Existing Modal Styles ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#002d69',
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: Dimensions.get('window').height * 0.6,
    paddingHorizontal: 8,
  },
  modalDoneBtn: {
    backgroundColor: '#004aad',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002d69',
    marginBottom: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },

  phoneInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
  },

  findBtn: {
    height: 48,
    paddingHorizontal: 22,
    backgroundColor: '#004aad',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  findBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#e6e6e6',
    marginVertical: 14,
  },

  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  customerInfoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002d69',
    marginLeft: 8,
  },

  customerInfoSub: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  timestampCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6f0ff',
    marginBottom: 16,

    // Android elevation
    elevation: 4,

    // iOS shadow
    shadowColor: '#002d69',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },


  timestampHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002d69',
    marginBottom: 10,
  },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  timestampLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    width: 90, // keeps alignment clean
  },

  timestampValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004aad',
  },
  timeTakenValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e0ae07ff',
  },
});

export default QuoteBuilderScreen;
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
  Modal,
  Dimensions,
  Platform,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../../config';

// --- Types & Data ---
interface LeadData {
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
  thickness?: string;
  urgency: 'Immediate' | 'In a week' | 'In a month' | 'Not required';
  costDetails: any[];
  totalCost: number;
  materialList: MaterialItem[];
  accessoryList: AccessoryItem[];
}

interface MaterialItem {
  id: number;
  name: string;
  brand: string;
  qty: string;
  price: string;
  total: number;
  unit: string;
}

interface AccessoryItem {
  id: number;
  name: string;
  variant: string;
  qty: string;
  price: string;
  total: number;
  unit: string;
}

interface MasterData {
  categories: Category[];
  sources: string[];
  districts: string[];
  materials: any[];
  accessories: any[];
}

interface Category {
  name: string;
  sub_categories: SubCategory[];
}

interface SubCategory {
  name: string;
  Suggested_product: Product[];
  channel: Channel[];
  accessories: AccessoryCategory[];
  gridtype: GridType[];
}

interface Product {
  name: string;
  price: string;
  price_bar: string;
}

interface Channel {
  name: string;
  variants: Variant[];
}

interface AccessoryCategory {
  name: string;
  variants: Variant[];
}

interface GridType {
  name: string;
  variants: Variant[];
}

interface Variant {
  brand: string;
  variant: string;
  price_bar: string;
}

const INITIAL_DATA: LeadData = {
  createdOn: new Date().toISOString(),
  leadSource: 'WhatsApp',
  fullName: '',
  phone: '',
  location: '',
  district: '',
  customerProfile: 'Contractor',
  areaSqft: '',
  projectType: 'False Ceiling',
  boardType: '',
  brand: '',
  channelType: '',
  tataType: '',
  thickness: '12mm',
  urgency: 'Not required',
  costDetails: [],
  totalCost: 0,
  materialList: [],
  accessoryList: [],
};

// --- Search Options ---
const SEARCH_OPTIONS = [
  // Step 1: Lead Source
  { id: 1, title: 'Lead Source', step: 1, description: 'Select WhatsApp, Call or WATI' },

  // Step 2: Customer Details
  { id: 2, title: 'Customer Name', step: 2, description: 'Enter full name of customer' },
  { id: 3, title: 'Phone Number', step: 2, description: 'Enter customer phone number' },
  { id: 4, title: 'Location', step: 2, description: 'Enter customer location' },
  { id: 5, title: 'District', step: 2, description: 'Enter customer district' },
  { id: 6, title: 'Customer Profile', step: 2, description: 'Contractor, Retailer, House Owner' },

  // Step 3: Project & Area
  { id: 7, title: 'Area Input', step: 3, description: 'Enter area in square feet', requiresMaterialMode: false },
  { id: 8, title: 'Project Type', step: 3, description: 'False Ceiling or Drywall Partition' },
  { id: 9, title: 'Material Mode Toggle', step: 3, description: 'Switch between material and area mode' },

  // Step 4: Materials (Standard Mode)
  { id: 10, title: 'Board Type', step: 4, description: 'Select gypsum, MR, fire resistant board' },
  { id: 11, title: 'Brand Selection', step: 4, description: 'SheetRock, Standard, Gyproc, USG Boral' },
  { id: 12, title: 'Channels', step: 4, description: 'Ceiling Section, Intermediate, Perimeter' },
  { id: 13, title: 'TATA Type', step: 4, description: 'TATA 30, 40, 45, 50 channels' },

  // Step 4: Materials (Material Mode)
  { id: 14, title: 'Material Pieces Input', step: 4, description: 'Enter material quantity pieces', requiresMaterialMode: true },
  { id: 15, title: 'Accessories Input', step: 4, description: 'Add accessories with quantity', requiresMaterialMode: true },
  { id: 16, title: 'Price Sheet', step: 4, description: 'View material and accessories prices' },

  // Step 5: Cost
  { id: 17, title: 'Cost Breakdown', step: 5, description: 'View detailed cost estimation' },
  { id: 18, title: 'Total Cost', step: 5, description: 'View final cost with GST' },

  // Step 6: Preview
  { id: 19, title: 'Quotation Preview', step: 6, description: 'Preview final quotation' },
  { id: 20, title: 'Download PDF', step: 6, description: 'Download quotation as PDF' },
  { id: 21, title: 'Send WhatsApp', step: 6, description: 'Send quotation via WhatsApp' },
  { id: 22, title: 'Send to Approver', step: 6, description: 'Send quotation for approval' },
];

// --- Main Component ---
const NewLeadScreen = ({ navigation }: any) => {
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LeadData>(INITIAL_DATA);
  const [isMaterialMode, setIsMaterialMode] = useState(false);
  const [materialQty, setMaterialQty] = useState('');
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [accessoryQty, setAccessoryQty] = useState('');
  const [accessoryPrice, setAccessoryPrice] = useState<string>('');
  const [accessoriesList, setAccessoriesList] = useState<AccessoryItem[]>([]);
  const [materialList, setMaterialList] = useState<MaterialItem[]>([]);
  const [showAccessoryDropdown, setShowAccessoryDropdown] = useState(false);
  const [showBoardTypeDropdown, setShowBoardTypeDropdown] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Dynamic options from master data
  const [boardTypeOptions, setBoardTypeOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [channelOptions, setChannelOptions] = useState<string[]>([]);
  const [tataOptions, setTataOptions] = useState<string[]>([]);
  const [accessoryOptions, setAccessoryOptions] = useState<AccessoryCategory[]>([]);

  const updateField = (key: keyof LeadData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setShowSearchResults(false);
      return;
    }

    const results = SEARCH_OPTIONS.filter(option =>
      option.title.toLowerCase().includes(query.toLowerCase()) ||
      option.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleSearchSelect = (item: any) => {
    if (item.requiresMaterialMode !== undefined) {
      setIsMaterialMode(item.requiresMaterialMode);
    }

    setCurrentStep(item.step);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        // This would be your actual API call
        const res = await fetch(`${SERVER_URL}/master-data`);
        const data = await res.json();

        setMasterData(data);
        setBoardTypeOptions(data.categories[0]?.sub_categories?.map((sc: SubCategory) => sc.name) || []);

        // Set initial board type if available
        if (data.categories[0]?.sub_categories?.length > 0) {
          const initialBoardType = data.categories[0].sub_categories[0].name;
          updateField('boardType', initialBoardType);

          // Update dependent options
          updateOptionsForBoardType(initialBoardType, data);
        }
      } catch (err) {
        console.log('Master data error', err);
      } finally {
        setLoadingMaster(false);
      }
    };

    fetchMasterData();
  }, []);

  // Update options when board type changes
  useEffect(() => {
    if (masterData && formData.boardType) {
      updateOptionsForBoardType(formData.boardType, masterData);
    }
  }, [formData.boardType, masterData]);

  const updateOptionsForBoardType = (boardType: string, data: MasterData) => {
    const category = data.categories[0];
    const subCategory = category.sub_categories.find((sc: SubCategory) => sc.name === boardType);

    if (subCategory) {
      // Update brand options
      const brands = subCategory.Suggested_product.map(p => p.name);
      setBrandOptions(brands);
      if (brands.length > 0 && !formData.brand) {
        updateField('brand', brands[0]);
      }

      // Update channel options
      const channels = subCategory.channel.map(c => c.name);
      setChannelOptions(channels);
      if (channels.length > 0 && !formData.channelType) {
        updateField('channelType', channels[0]);
      }

      // Update TATA options based on selected channel
      if (formData.channelType) {
        const selectedChannel = subCategory.channel.find(c => c.name === formData.channelType);
        if (selectedChannel) {
          const tataTypes = selectedChannel.variants.map(v => `${v.brand} ${v.variant}`);
          setTataOptions(tataTypes);
          if (tataTypes.length > 0 && !formData.tataType) {
            updateField('tataType', tataTypes[0]);
          }
        }
      }

      // Update accessory options
      setAccessoryOptions(subCategory.accessories);
    }
  };

  // Get current subcategory
  const getCurrentSubCategory = () => {
    if (!masterData || !formData.boardType) return null;
    const category = masterData.categories[0];
    return category.sub_categories.find((sc: SubCategory) => sc.name === formData.boardType);
  };

  // Helper to add material
  const addMaterial = () => {
    if (materialQty && formData.boardType && formData.brand) {
      const subCategory = getCurrentSubCategory();
      const product = subCategory?.Suggested_product.find(p => p.name === formData.brand);
      const materialInfo = masterData?.materials.find(m => m.name === formData.brand);

      if (product && materialInfo) {
        const newMaterial: MaterialItem = {
          id: Date.now(),
          name: formData.boardType,
          brand: formData.brand,
          qty: materialQty,
          price: `₹${product.price}`,
          total: parseInt(materialQty) * parseInt(product.price),
          unit: materialInfo.unit || 'per sheet'
        };

        const updatedList = [...materialList, newMaterial];
        setMaterialList(updatedList);
        updateField('materialList', updatedList);
        setMaterialQty('');
      }
    } else {
      Alert.alert('Input Missing', 'Please select material type, brand and enter quantity.');
    }
  };

  // Helper to find accessory from master data (flat accessories list)
  const findAccessoryFromMaster = (accessoryName: string): any | undefined => {
    if (!masterData) return undefined;
    return masterData.accessories.find((item: any) =>
      item.name.toLowerCase().includes(accessoryName.toLowerCase())
    ) || masterData.accessories[0];
  };

  // Helper to add accessory
  const addAccessory = () => {
    if (selectedAccessory && accessoryQty) {
      // Find accessory in flat accessories list
      const accessoryInfo = masterData?.accessories.find(acc =>
        acc.name.toLowerCase().includes(selectedAccessory.toLowerCase())
      );

      if (accessoryInfo) {
        const newAccessory: AccessoryItem = {
          id: Date.now(),
          name: selectedAccessory,
          variant: accessoryInfo.name.split('(')[1]?.replace(')', '') || '',
          qty: accessoryQty,
          price: `₹${accessoryInfo.price}`,
          total: parseInt(accessoryQty) * accessoryInfo.price,
          unit: accessoryInfo.unit
        };

        const updatedList = [...accessoriesList, newAccessory];
        setAccessoriesList(updatedList);
        updateField('accessoryList', updatedList);
        setSelectedAccessory('');
        setAccessoryQty('');
        setShowAccessoryDropdown(false);
      }
    } else {
      Alert.alert('Input Missing', 'Please select an accessory and enter quantity.');
    }
  };

  // Helper to remove material
  const removeMaterial = (index: number) => {
    const newList = [...materialList];
    newList.splice(index, 1);
    setMaterialList(newList);
    updateField('materialList', newList);
  };

  // Helper to remove accessory
  const removeAccessory = (index: number) => {
    const newList = [...accessoriesList];
    newList.splice(index, 1);
    setAccessoriesList(newList);
    updateField('accessoryList', newList);
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

      const breakdown = [
        ...materialList.map(item => ({
          item: `${item.name} - ${item.brand}`,
          qty: `${item.qty} ${item.unit}`,
          price: item.price,
          total: item.total,
        })),
        ...accessoriesList.map(item => ({
          item: item.name,
          qty: `${item.qty} ${item.unit}`,
          price: item.price,
          total: item.total,
        })),
      ];

      setFormData((prev) => ({
        ...prev,
        costDetails: breakdown,
        totalCost: finalTotal,
      }));
      setLoading(false);
      setCurrentStep(5);
      return;
    }

    // Original calculation for non-material mode
    setTimeout(() => {
      const area = parseFloat(formData.areaSqft) || 0;
      const subCategory = getCurrentSubCategory();
      const product = subCategory?.Suggested_product.find(p => p.name === formData.brand);

      const sheetsNeeded = Math.ceil(area / 30);
      const sheetPrice = product ? parseInt(product.price) : 550;
      const brandPremium = formData.brand.includes('Standard') ? 2000 : 5000;
      const channelCost = area * 12;

      const breakdown = [
        {
          item: `${formData.boardType} - ${formData.brand}`,
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
          item: `${formData.tataType} Channel`,
          qty: `${area} ft`,
          price: '₹12/ft',
          total: channelCost,
        },
      ];

      const subtotal = breakdown.reduce((acc, item) => acc + item.total, 0);
      const tax = subtotal * 0.15;
      const finalTotal = subtotal + tax;

      setFormData((prev) => ({
        ...prev,
        costDetails: breakdown,
        totalCost: finalTotal,
      }));
      setLoading(false);
      setCurrentStep(5);
    }, 800);
  };

  const submitQuotation = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Quotation sent via WhatsApp!');
    }, 1500);
  };

  const sendToApprover = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Quotation sent to approver for review!');
    }, 1500);
  };

  // --- Reusable Toggle Switch Component ---
  const MovableSwitch = ({
    value,
    onValueChange,
  }: {
    value: boolean;
    onValueChange: (val: boolean) => void;
  }) => (
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
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.tableCol1]}>MATERIAL</Text>
                  <Text style={[styles.th, styles.tableCol2]}>BRAND</Text>
                  <Text style={[styles.th, styles.tableCol3]}>PRICE</Text>
                  <Text style={[styles.th, styles.tableCol4]}>UNIT</Text>
                </View>
                {masterData?.materials.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tdTitle, styles.tableCol1]}>{item.name}</Text>
                    <Text style={[styles.tdSub, styles.tableCol2]}>{item.brand}</Text>
                    <Text style={[styles.tdPrice, styles.tableCol3]}>₹{item.price}</Text>
                    <Text style={[styles.tdSub, styles.tableCol4]}>{item.unit}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Accessories Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Accessories Price List</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.tableCol1]}>ACCESSORY</Text>
                  <Text style={[styles.th, styles.tableCol3]}>PRICE</Text>
                  <Text style={[styles.th, styles.tableCol4]}>UNIT</Text>
                </View>
                {masterData?.accessories.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tdTitle, styles.tableCol1]}>{item.name}</Text>
                    <Text style={[styles.tdPrice, styles.tableCol3]}>₹{item.price}</Text>
                    <Text style={[styles.tdSub, styles.tableCol4]}>{item.unit}</Text>
                  </View>
                ))}
              </View>
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

  // --- Render Steps ---

  // STEP 1: LEAD SOURCE (with Search)
  const renderStep1 = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>New Lead</Text>
      <Text style={styles.cardSubtitle}>Create a new customer lead</Text>

      <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
          <Icon name="calendar-month" size={18} color="#004aad" />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>Lead Created On:</Text>
          <Text style={styles.infoValue}>{formData.createdOn}</Text>
        </View>
      </View>

      <Text style={styles.label}>Lead Source</Text>
      <View style={styles.dropdownBox}>
        <Text style={styles.dropdownText}>{formData.leadSource}</Text>
        <Icon name="chevron-down" size={20} color="#666666" />
      </View>

      <View style={styles.menuContainer}>
        {masterData?.sources?.map((item, idx) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.menuItem,
              idx === (masterData?.sources.length || 0) - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => updateField('leadSource', item)}>
            <Icon
              name={
                item === 'Call' ? 'phone' : item === 'WATI' ? 'web' : 'whatsapp'
              }
              size={20}
              color={formData.leadSource === item ? '#004aad' : '#666666'}
            />
            <Text
              style={[
                styles.menuItemText,
                formData.leadSource === item && styles.menuItemTextActive,
              ]}>
              {item}
            </Text>
            {formData.leadSource === item && (
              <Icon name="check-circle" size={18} color="#004aad" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.blueNote}>
        <Icon
          name="information-outline"
          size={16}
          color="#004aad"
          style={styles.infoIcon}
        />
        <Text style={styles.blueNoteText}>
          This lead will be linked to your account.{'\n'}
          Sales Person: <Text style={styles.boldText}>Mr. Vishnu</Text>
        </Text>
      </View>

      <View style={styles.buttonSpacing} />
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => setCurrentStep(2)}>
        <Text style={styles.primaryBtnText}>Create & Continue</Text>
        <Icon name="arrow-right" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // STEP 2: CUSTOMER DETAILS
  const renderStep2 = () => (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerLg}>Customer Details</Text>
        <Text style={styles.stepIndicator}>Step 2 of 6</Text>
      </View>

      <InputGroup
        label="Full Name"
        value={formData.fullName}
        onChange={(t: any) => updateField('fullName', t)}
        placeholder="Enter Full Name"
      />
      <InputGroup
        label="Phone Number"
        value={formData.phone}
        onChange={(t: any) => updateField('phone', t)}
        placeholder="Enter Phone Number"
        keyboardType="phone-pad"
        isPhone
      />
      <InputGroup
        label="Location"
        value={formData.location}
        onChange={(t: any) => updateField('location', t)}
        placeholder="Enter Location"
      />
      <Text style={styles.label}>District</Text>
      <InputGroup
        label="District"
        value={formData.district}
        onChange={(t: any) => updateField('district', t)}
        placeholder="Enter District"
      />

      <Text style={[styles.label, styles.sectionSpacing]}>
        Customer Profile
      </Text>
      <View style={styles.gridContainer}>
        {['Contractor', 'Retailer', 'House Owner', 'Project'].map((role) => (
          <SelectionBox
            key={role}
            label={role}
            icon={
              role === 'Contractor'
                ? 'hard-hat'
                : role === 'Retailer'
                  ? 'store'
                  : role === 'House Owner'
                    ? 'home-account'
                    : 'domain'
            }
            selected={formData.customerProfile === role}
            onPress={() => updateField('customerProfile', role)}
          />
        ))}
      </View>

      <View style={styles.buttonSpacing} />
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => setCurrentStep(3)}>
        <Text style={styles.primaryBtnText}>Save & Continue</Text>
        <Icon name="arrow-right" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // STEP 3: PROJECT SPECS
  const renderStep3 = () => (
    <View style={styles.card}>
      <View style={styles.stepHeaderContainer}>
        <Text style={styles.headerLg}>Project & Area Details</Text>
        <View style={styles.stepSwitchRow}>
          <Text style={styles.stepIndicator}>Step 3 of 6</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Material Mode</Text>
            <MovableSwitch
              value={isMaterialMode}
              onValueChange={setIsMaterialMode}
            />
          </View>
        </View>
      </View>

      {/* --- TOTAL AREA (Only visible when Material Mode is OFF) --- */}
      {!isMaterialMode && (
        <View style={styles.areaSection}>
          <Text style={styles.label}>Area Details</Text>
          <View style={styles.areaContainer}>
            <Text style={styles.areaLabel}>Area (Sqft)</Text>
            <View style={styles.areaInputWrapper}>
              <TextInput
                style={styles.areaInput}
                placeholder="Enter Area"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                value={formData.areaSqft}
                onChangeText={(t) => updateField('areaSqft', t)}
              />
              <Text style={styles.unitText}>Sqft</Text>
            </View>
            <Text style={styles.areaHelper}>
              Total area in square feet
            </Text>
          </View>
        </View>
      )}

      {/* --- PROJECT TYPE (Always Visible) --- */}
      <View style={styles.sectionSpacing}>
        <Text style={styles.label}>Project Type</Text>
        <View style={styles.gridContainer}>
          {masterData?.categories?.map((category) => (
            <SelectionBox
              key={category.name}
              label={category.name}
              icon="ceiling-light"
              selected={formData.projectType === category.name}
              onPress={() => updateField('projectType', category.name)}
              fullWidth={false}
            />
          ))}
        </View>
      </View>

      <View style={styles.buttonSpacing} />
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => setCurrentStep(4)}>
        <Text style={styles.primaryBtnText}>Save & Continue</Text>
        <Icon name="arrow-right" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // STEP 4: MATERIALS SELECTION
  const renderStep4 = () => (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerLg}>Materials Selection</Text>
        <Text style={styles.stepIndicator}>Step 4 of 6</Text>
      </View>

      {/* --- BOARD TYPE DROPDOWN --- */}
      <Text style={styles.label}>Board Type</Text>
      <TouchableOpacity
        style={styles.pickerBox}
        onPress={() => setShowBoardTypeDropdown(!showBoardTypeDropdown)}>
        <Text style={styles.pickerText}>
          {formData.boardType || 'Select Board Type'}
        </Text>
        <Icon
          name={showBoardTypeDropdown ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#004aad"
        />
      </TouchableOpacity>

      {showBoardTypeDropdown && (
        <View style={styles.dropdownList}>
          {boardTypeOptions.map((boardType, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dropdownItem,
                idx === boardTypeOptions.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => {
                updateField('boardType', boardType);
                setShowBoardTypeDropdown(false);
              }}>
              <Icon
                name={
                  boardType.includes('Fire') ? 'fire' :
                    boardType.includes('Moisture') ? 'water' :
                      boardType.includes('Acoustic') ? 'volume-high' :
                        boardType.includes('Flexible') ? 'shape-outline' :
                          'view-grid'
                }
                size={18}
                color="#004aad"
                style={{ marginRight: 10 }}
              />
              <Text style={[
                styles.dropdownItemText,
                formData.boardType === boardType && { color: '#004aad', fontWeight: '600' }
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

      {/* Brand Selection */}
      <Text style={styles.label}>Brand</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}>
        {brandOptions.map((b) => (
          <TouchableOpacity
            key={b}
            style={[styles.chip, formData.brand === b && styles.chipActive]}
            onPress={() => updateField('brand', b)}>
            <Text
              style={[
                styles.chipText,
                formData.brand === b && styles.chipTextActive,
              ]}>
              {b}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Channels */}
      <Text style={styles.label}>Channels</Text>
      <View style={styles.chipGrid}>
        {channelOptions.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.chip,
              formData.channelType === c && styles.chipActive,
            ]}
            onPress={() => updateField('channelType', c)}>
            <Text
              style={[
                styles.chipText,
                formData.channelType === c && styles.chipTextActive,
              ]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TATA Variants */}
      <Text style={styles.label}>Channel Variants</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}>
        {tataOptions.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, formData.tataType === t && styles.chipActive]}
            onPress={() => updateField('tataType', t)}>
            <Text
              style={[
                styles.chipText,
                formData.tataType === t && styles.chipTextActive,
              ]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              onPress={() => setShowSheetModal(true)}>
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
          </View>

          {/* Material Input */}
          <View style={styles.equalWidthInputRow}>
            <View style={styles.equalWidthInputGroup}>
              <Text style={styles.inputLabelSmall}>Quantity</Text>
              <TextInput
                style={styles.equalWidthInput}
                placeholder="Enter qty"
                keyboardType="numeric"
                value={materialQty}
                onChangeText={setMaterialQty}
              />
            </View>

            <View style={styles.roundButtonContainer}>
              <Text style={styles.inputLabelSmall}>&nbsp;</Text>
              <TouchableOpacity
                style={[
                  styles.roundAddButton,
                  (!materialQty || !formData.boardType || !formData.brand) && styles.roundButtonDisabled
                ]}
                onPress={addMaterial}
                disabled={!materialQty || !formData.boardType || !formData.brand}>
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
                    <Text style={[styles.tdTitle, styles.tableCol1]}>{item.name}</Text>
                    <Text style={[styles.tdSub, styles.tableCol2]}>{item.brand}</Text>
                    <Text style={[styles.tdSub, styles.tableCol3]}>{item.qty} {item.unit}</Text>
                    <Text style={[styles.tdSub, styles.tableCol4]}>{item.price}</Text>
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

          {/* Accessory Selection */}
          <View style={styles.accessorySelectionRow}>
            <View style={styles.accessoryPickerContainer}>
              <Text style={styles.inputLabelSmall}>Select Accessory</Text>
              <TouchableOpacity
                style={styles.accessoryPickerBox}
                onPress={() => setShowAccessoryDropdown(!showAccessoryDropdown)}>
                <Text style={styles.accessoryPickerText}>
                  {selectedAccessory || 'Select Accessory'}
                </Text>
                <Icon
                  name={showAccessoryDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dropdown List */}
          {showAccessoryDropdown && (
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

          {/* Accessory Input */}
          <View style={styles.equalWidthInputRow}>
            <View style={styles.equalWidthInputGroup}>
              <Text style={styles.inputLabelSmall}>Quantity</Text>
              <TextInput
                style={styles.equalWidthInput}
                placeholder="Enter qty"
                keyboardType="numeric"
                value={accessoryQty}
                onChangeText={setAccessoryQty}
              />
            </View>

            <View style={styles.roundButtonContainer}>
              <Text style={styles.inputLabelSmall}>&nbsp;</Text>
              <TouchableOpacity
                style={[
                  styles.roundAddButton,
                  (!selectedAccessory || !accessoryQty) && styles.roundButtonDisabled
                ]}
                onPress={addAccessory}
                disabled={!selectedAccessory || !accessoryQty}>
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
                {accessoriesList.map((item, idx) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tdTitle, styles.tableCol1]}>{item.name}</Text>
                    <Text style={[styles.tdSub, styles.tableCol2]}>{item.unit}</Text>
                    <Text style={[styles.tdSub, styles.tableCol3]}>{item.qty}</Text>
                    <Text style={[styles.tdSub, styles.tableCol4]}>{item.price}</Text>
                    <Text style={[styles.tdPrice, styles.tableCol5]}>₹{item.total}</Text>
                    <TouchableOpacity
                      onPress={() => removeAccessory(idx)}
                      style={styles.tableCol6}>
                      <Icon name="trash-can-outline" size={16} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
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
      <TouchableOpacity style={styles.primaryBtn} onPress={calculateCosts}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>Calculate Cost</Text>
            <Icon name="arrow-right" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const generateQuotation = async () => {
    try {
      setLoading(true);

      const payload = {
        timestamp: new Date().toISOString(),
        source: formData.leadSource,
        customer_name: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        district: formData.district,

        profile: formData.customerProfile,
        process_type: formData.projectType,    // AREA | MATERIAL

        area_sqft: Number(formData.areaSqft) || null,

        category_interest: formData.boardType,
        brand_preference: formData.brand,

        urgency: formData.urgency,
        follow_up_date: new Date().toISOString(),             // REQUIRED
        sales_executive_id: "SE-001"            // REQUIRED
      };

      const response = await fetch(`${SERVER_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      const result = await response.json();
      console.log('Lead created:', result);
      setCurrentStep(6);

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to generate quotation.');
    } finally {
      setLoading(false);
    }
  };


  // STEP 5: COST BREAKDOWN
  const renderStep5 = () => (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerLg}>Estimated Cost</Text>
        <Text style={styles.stepIndicator}>Step 5 of 6</Text>
      </View>

      <Text style={styles.subHeader}>Cost Breakdown</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.tableCol1]}>ITEM</Text>
          <Text style={[styles.th, styles.tableCol2]}>QUANTITY</Text>
          <Text style={[styles.th, styles.tableCol3]}>PRICE</Text>
          <Text style={[styles.th, styles.tableCol4]}>TOTAL</Text>
        </View>
        {formData.costDetails.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tdTitle, styles.tableCol1]}>{item.item}</Text>
            <Text style={[styles.tdSub, styles.tableCol2]}>{item.qty}</Text>
            <Text style={[styles.tdSub, styles.tableCol3]}>{item.price}</Text>
            <Text style={[styles.tdPrice, styles.tableCol4]}>
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
          <Text style={styles.totalLabel}>Total Estimated Cost</Text>
          <Text style={styles.gstNote}>(Incl. 15% GST)</Text>
        </View>
        <Text style={styles.totalAmount}>
          ₹{(formData.totalCost || 0).toLocaleString()}
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
        onPress={generateQuotation}>
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

  // STEP 6: PREVIEW
  const renderStep6 = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Icon name="office-building" size={28} color="#004aad" />
          <View style={styles.previewHeaderContent}>
            <Text style={styles.companyName}>STK Associates</Text>
            <View style={styles.quoteInfo}>
              <Text style={styles.quoteId}>Quotation #: QT-2024-10-26-001</Text>
              <Text style={styles.quoteDate}>Date: 2024-10-26</Text>
            </View>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>CUSTOMER DETAILS</Text>
          <Text style={styles.previewValue}>
            Name: {formData.fullName || 'Mr. Vishnu'}
          </Text>
          <Text style={styles.previewSubValue}>
            Phone: {formData.phone || '+91 9876543210'}
          </Text>
          <Text style={styles.previewSubValue}>
            Location: {formData.location || 'Salem, TN'}
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
              Area: {formData.areaSqft || '1500'} Sqft
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

      <TouchableOpacity style={styles.primaryBtn} onPress={() => { }}>
        <Icon name="file-pdf-box" size={20} color="#fff" />
        <Text style={styles.actionBtnText}>Download PDF</Text>
      </TouchableOpacity>

      <View style={styles.buttonSpacingSmall} />
      <TouchableOpacity style={styles.whatsappBtn} onPress={submitQuotation}>
        <Icon name="whatsapp" size={20} color="#fff" />
        <Text style={styles.actionBtnText}>Send via WhatsApp</Text>
      </TouchableOpacity>

      <View style={styles.buttonSpacingSmall} />
      <TouchableOpacity style={styles.approverBtn} onPress={sendToApprover}>
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

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* iOS Style Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() =>
            currentStep > 1
              ? setCurrentStep(currentStep - 1)
              : navigation?.goBack()
          }
          style={styles.navBtn}>
          <Icon name="chevron-left" size={28} color="#004aad" />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>
            {currentStep === 1 && 'New Lead'}
            {currentStep === 2 && 'Customer Details'}
            {currentStep === 3 && 'Project & Area Details'}
            {currentStep === 4 && 'Materials Selection'}
            {currentStep === 5 && 'Estimated Cost'}
            {currentStep === 6 && 'Quotation Preview'}
          </Text>
          <Text style={styles.navSubtitle}>Step {currentStep} of 6</Text>
        </View>
        <View style={styles.navBtn} />
      </View>

      {/* SEARCH BAR - Common for all pages */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search any subtopic"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setShowSearchResults(false);
          }}>
            <Icon name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Progress */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / 6) * 100}%` },
          ]}
        />
      </View>

      {/* Overlay for search results - positioned directly under search bar */}
      {showSearchResults && (
        <View style={styles.searchResultsWrapper}>
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            <ScrollView
              style={styles.searchResultsScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.searchResultItem,
                    item.requiresMaterialMode !== undefined && item.requiresMaterialMode && styles.searchResultMaterialMode,
                    item.requiresMaterialMode !== undefined && !item.requiresMaterialMode && styles.searchResultStandardMode
                  ]}
                  onPress={() => handleSearchSelect(item)}>
                  <View style={styles.searchResultLeft}>
                    <View style={[
                      styles.searchStepBadge,
                      {
                        backgroundColor:
                          item.requiresMaterialMode === true ? '#28a745' :
                            item.requiresMaterialMode === false ? '#004aad' :
                              '#666'
                      }
                    ]}>
                      <Text style={styles.searchStepBadgeText}>Step {item.step}</Text>
                    </View>
                  </View>
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultTitle}>{item.title}</Text>
                    <Text style={styles.searchResultDesc}>{item.description}</Text>
                    {item.requiresMaterialMode === true && (
                      <Text style={styles.materialModeHint}>
                        <Icon name="cube-outline" size={12} color="#28a745" /> Material mode required
                      </Text>
                    )}
                    {item.requiresMaterialMode === false && (
                      <Text style={styles.standardModeHint}>
                        <Icon name="calculator" size={12} color="#004aad" /> Standard mode required
                      </Text>
                    )}
                  </View>
                  <Icon name="chevron-right" size={16} color="#999" />
                </TouchableOpacity>
              ))}
              {searchResults.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Icon name="magnify-close" size={40} color="#ccc" />
                  <Text style={styles.noResultsText}>No subtopics found</Text>
                  <Text style={styles.noResultsSubtext}>Try different keywords</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Touchable overlay to close dropdown when tapping outside */}
          <TouchableOpacity
            style={styles.searchOverlayBackground}
            activeOpacity={1}
            onPress={() => setShowSearchResults(false)}
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {loadingMaster ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004aad" />
            <Text style={styles.loadingText}>Loading master data...</Text>
          </View>
        ) : (
          <>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
          </>
        )}
      </ScrollView>

      {/* Sheet Modal */}
      <SheetModal />
    </SafeAreaView>
  );
};

// --- Sub-Components ---
const InputGroup = ({
  label,
  placeholder,
  value,
  onChange,
  keyboardType,
  isPhone,
}: any) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>
      <Icon
        name={
          label.includes('Name') ? 'account' :
            label.includes('Phone') ? 'phone' :
              label.includes('Location') ? 'map-marker' :
                label.includes('District') ? 'city' :
                  'text'
        }
        size={14}
        color="#004aad"
        style={styles.inputIcon}
      />
      {label}
    </Text>
    <View style={styles.inputField}>
      {isPhone && <Text style={styles.phonePrefix}>+91</Text>}
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

const SelectionBox = ({ label, icon, selected, onPress, fullWidth }: any) => (
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
    paddingTop: 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  previewContainer: {
    paddingBottom: 40
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#cccccc',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1001,
  },
  searchResultsWrapper: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  searchOverlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 20,
    maxHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  searchResultsScroll: {
    maxHeight: 300,
  },
  searchResultsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    padding: 12,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
  },
  searchResultLeft: {
    width: 50,
    marginRight: 8,
  },
  searchStepBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  searchStepBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  searchResultContent: {
    flex: 1,
    marginRight: 8,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d69',
    marginBottom: 2,
  },
  searchResultDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  materialModeHint: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '500',
    marginTop: 2,
  },
  standardModeHint: {
    fontSize: 10,
    color: '#004aad',
    fontWeight: '500',
    marginTop: 2,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
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
    justifyContent: 'center'
  },
  navTitleContainer: {
    alignItems: 'center'
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
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#002d69',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
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

  // === Info Row ===
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#002d69',
    fontWeight: '600',
  },

  // === Labels ===
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002d69',
    marginBottom: 8,
  },
  // === Inputs ===
  inputWrapper: {
    marginBottom: 16
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
    marginRight: 6
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
    fontWeight: '400'
  },
  phonePrefix: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
    marginRight: 8,
    paddingRight: 8,
  },


  // === Dropdown ===
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    fontWeight: '400',
    marginLeft: 8,
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
    fontWeight: '400'
  },

  // === Menu Items ===
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cccccc',
    marginBottom: 16,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    marginLeft: 10,
    fontWeight: '400'
  },
  menuItemTextActive: {
    fontWeight: '600',
    color: '#004aad'
  },

  // === Blue Note ===
  blueNote: {
    backgroundColor: '#e6f0ff',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#004aad',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 6,
    marginTop: 1
  },
  blueNoteText: {
    color: '#002d69',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    flex: 1
  },
  // === Buttons & Spacing ===
  buttonSpacing: {
    height: 20
  },
  buttonSpacingSmall: {
    height: 12
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
    width: '48%'
  },
  selectBoxFull: {
    width: '100%'
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
    fontWeight: '600'
  },
  selectCheckIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // === Area Input ===
  areaSection: {
    marginBottom: 20
  },
  areaContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  areaLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
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
  areaHelper: {
    fontSize: 11,
    color: '#999999',
    marginTop: 8,
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
    justifyContent: 'center'
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    elevation: 2
  },

  // === Chips ===
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 16
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
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
    color: '#666666'
  },
  chipTextActive: {
    color: '#fff'
  },


  // === Accessories ===
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
    elevation: 3
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
    flex: 1
  },

  // === Table ===
  table: {
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d0e0ff',
  },
  th: {
    fontSize: 10,
    color: '#002d69',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tdTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#002d69'
  },
  tdSub: {
    fontSize: 11,
    color: '#666666'
  },
  tdPrice: {
    fontSize: 12,
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
    color: '#fff'
  },
  gstNote: {
    fontSize: 11,
    color: '#a0c0ff',
    marginTop: 3
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
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
    color: '#002d69'
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
    fontWeight: '400'
  },
  quoteDate: {
    fontSize: 11,
    color: '#666666'
  },
  previewSection: {
    marginBottom: 20
  },
  previewLabel: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
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
    color: '#002d69'
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
    color: '#004aad'
  },

  // === Modal Styles ===
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
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0ff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002d69',
    marginBottom: 12,
  },

  searchResultMaterialMode: {
    backgroundColor: '#e6f9ed',
  },

  searchResultStandardMode: {
    backgroundColor: '#e6f0ff',
  },

  // Table Columns (updated for 6 columns)
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
});

export default NewLeadScreen;
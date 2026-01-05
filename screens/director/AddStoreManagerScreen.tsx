import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { SERVER_URL } from '../../config';
const THEME_BLUE = '#003478';
const BG_LIGHT = '#f8f9fa';
const CARD_WHITE = '#ffffff';

const API_URL = 'https://api-stk.moshimoshi.cloud';

interface StaffListItem {
    id: number;
    staff_id: string;
    full_name: string;
    password: string;
    store_assigned: string;
}

const AddStoreManagerScreen = ({ navigation }: any) => {
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [storeAssigned, setStoreAssigned] = useState('');
    const [storeManagers, setStoreManagers] = useState<StaffListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchStoreManagers();
    }, []);

    const fetchStoreManagers = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');

            const response = await fetch(`${SERVER_URL}/director-dashboard/store-managers`, {
                method: 'GET',
                headers: {
                    // 'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStoreManagers(data);
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch store managers:', response.status, errorText);
                Alert.alert('Error', `Failed to fetch store managers: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching store managers:', error);
            Alert.alert('Error', 'Network error. Please check your connection.');
        } finally {
            setFetchingData(false);
        }
    };

    const handleCreateStoreManager = async () => {
        if (!fullName.trim() || !password.trim() || !storeAssigned.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('access_token');

            const response = await fetch(`${SERVER_URL}/director-dashboard/create-store-manager`, {
                method: 'POST',
                headers: {
                    // 'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: fullName,
                    password: password,
                    store_assigned: storeAssigned,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                Alert.alert(
                    'Success',
                    `Store Manager created successfully!\nID: ${data.staff_id}`,
                    [{
                        text: 'OK', onPress: () => {
                            setFullName('');
                            setPassword('');
                            setStoreAssigned('');
                            fetchStoreManagers();
                        }
                    }]
                );
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.detail || 'Failed to create store manager');
            }
        } catch (error) {
            console.error('Error creating store manager:', error);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getLocationCode = (storeName: string): string => {
        const cleaned = storeName.replace(/\b(store|branch|office)\b/gi, '').trim();
        return cleaned.substring(0, 3).toUpperCase() || 'GEN';
    };

    const previewId = storeAssigned.trim()
        ? `SM-${getLocationCode(storeAssigned)}-XXX`
        : 'SM-XXX-XXX';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={THEME_BLUE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Store Manager</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Form Card */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Create New Store Manager</Text>
                    <Text style={styles.idPreview}>ID Preview: {previewId}</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter full name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Icon
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Store Location</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={storeAssigned}
                                onValueChange={(itemValue) => setStoreAssigned(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select Store Location" value="" />
                                <Picker.Item label="Palakkad" value="Palakkad" />
                                <Picker.Item label="Ernakulam" value="Ernakulam" />
                                <Picker.Item label="Thrissur" value="Thrissur" />
                                <Picker.Item label="Azhapula" value="Azhapula" />
                            </Picker>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.createButton, loading && styles.createButtonDisabled]}
                        onPress={handleCreateStoreManager}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Icon name="account-plus" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.createButtonText}>Create Store Manager</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Store Managers List */}
                <View style={styles.tableCard}>
                    <Text style={styles.sectionTitle}>Existing Store Managers</Text>

                    {fetchingData ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={THEME_BLUE} />
                        </View>
                    ) : storeManagers.length === 0 ? (
                        <Text style={styles.emptyText}>No store managers created yet</Text>
                    ) : (
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>ID</Text>
                                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Location</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Password</Text>
                            </View>

                            {/* Table Rows */}
                            {storeManagers.map((manager) => (
                                <View key={manager.id} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>{manager.staff_id}</Text>
                                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                                        {manager.full_name}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                                        {manager.store_assigned}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                                        {manager.password}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddStoreManagerScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BG_LIGHT,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: CARD_WHITE,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: THEME_BLUE,
    },
    formCard: {
        backgroundColor: CARD_WHITE,
        margin: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: THEME_BLUE,
        marginBottom: 12,
    },
    idPreview: {
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: '600',
        marginBottom: 16,
        backgroundColor: '#ddd6fe',
        padding: 8,
        borderRadius: 8,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
        backgroundColor: '#f8fafc',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        backgroundColor: '#f8fafc',
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        fontSize: 14,
        color: '#1e293b',
    },
    eyeIcon: {
        padding: 12,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#1e293b',
    },
    createButton: {
        backgroundColor: THEME_BLUE,
        borderRadius: 10,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    createButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    tableCard: {
        backgroundColor: CARD_WHITE,
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 16,
        elevation: 3,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
        padding: 20,
    },
    table: {
        marginTop: 12,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 8,
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: THEME_BLUE,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tableCell: {
        fontSize: 12,
        color: '#334155',
    },
});

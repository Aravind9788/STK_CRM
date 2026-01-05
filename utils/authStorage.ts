import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const storeTokens = async (accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem("userToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
};

export const getTokens = async () => {
    const access = await AsyncStorage.getItem("userToken");
    const refresh = await SecureStore.getItemAsync("refreshToken");
    return { access, refresh };
};

export const clearTokens = async () => {
    await AsyncStorage.removeItem("userToken");
    await SecureStore.deleteItemAsync("refreshToken");
};

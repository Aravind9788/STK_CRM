import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';


const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#F5F9FF';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      /* =========================
         ✅ DUMMY LOGIN (DEV MODE)
         ========================= */
      if (email === 'aravindh' && password === '1234') {


        navigation.replace('TeamLeadDashboard');
        return; // ⛔ stop backend call
      }
      if (email === 'aravindh' && password === '5678') {


        navigation.replace('DirectorDashboard');
        return; // ⛔ stop backend call
      }

      // STORE MANAGER
      if (email === 'aravind' && password === '123') {

        navigation.replace('StoreManagerDashboard');
        return; // ⛔ stop backend call
      }


      /* =========================
         🔗 REAL BACKEND LOGIN
         ========================= */
      const response = await fetch(`${SERVER_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Login Failed',
          data?.detail || data?.message || 'Invalid credentials'
        );
        return;
      }

      if (data?.access_token) {
        await AsyncStorage.setItem('access_token', data.access_token);

        /* ✅ SAFE ROLE HANDLING */
        const role =
          data.role ||
          (email.toUpperCase().startsWith('SM')
            ? 'STORE_MANAGER'
            : 'SALES');

        if (role === 'STORE_MANAGER') {
          navigation.replace('StoreManagerDashboard');
        } else {
          navigation.replace('Dashboard', { email });
        }

      } else {
        Alert.alert('Login Failed', 'Token not received from server');
      }

    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Network Error', 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>

        {/* UPDATED SECTION: 
           Removed the wrapping View (logoBox) and applied centering directly to the Image style.
        */}
        <Image
          source={{ uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png' }}
          style={styles.logo}
        />

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionText}>
            Sign in to access your dashboard
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID Number</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="email-outline"
                size={20}
                color="#64748B"
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your ID"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="lock-outline"
                size={20}
                color="#64748B"
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 10 }}>
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {!loading ? (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Icon name="arrow-right" size={20} color="#fff" />
              </>
            ) : (
              <ActivityIndicator color="#fff" size="small" />
            )}
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity>
            <Text style={styles.signupText}>Contact Admin</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  // --- UPDATED LOGO STYLE ---
  logo: {
    width: 220,  // Slightly wider for better aspect ratio
    height: 80,
    resizeMode: 'contain',
    alignSelf: 'center', // THIS CENTERS THE IMAGE HORIZONTALLY
    marginBottom: 30,    // Adds space between logo and the card
  },
  // 'logoBox' style is removed as it is no longer used in the JSX.

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center'
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 32,
    textAlign: 'center'
  },

  // Inputs
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  // Links & Buttons
  forgotText: {
    fontSize: 13,
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: PRIMARY_COLOR,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  signupText: {
    color: PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});

export default LoginScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { API_CONFIG, getApiHeaders, findWorkingServer, API_ENDPOINTS } from '../../config/api';
import { authUtils } from '../../utils/auth';
import { safeFetch, getErrorMessage } from '../../utils/responseHandler';
import CustomAlert from '../../components/CustomAlert';
import { useNavigation } from '../../context/NavigationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { UI_CONSTANTS, COMMON_STYLES, UI_UTILS } from '../../utils/uiConstants';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { changeLanguage } = useLanguage();
  const { loadUserNavigation } = useNavigation();
  const { handleUserLogin } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: t('common.ok'),
    cancelText: t('common.cancel'),
    showCancel: false,
  });

  const showAlert = (title, message, type = 'info', onConfirm = () => {}, showCancel = false) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onConfirm();
      },
      onCancel: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
      },
      confirmText: t('common.ok'),
      cancelText: t('common.cancel'),
      showCancel,
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert(t('common.error'), t('auth.fillAllFields'), 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(t('common.error'), t('auth.validEmail'), 'error');
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== Login Attempt Started ===');
      console.log('Primary server URL:', API_CONFIG.BASE_URL);
      console.log('Login endpoint:', API_ENDPOINTS.LOGIN());

      // Try primary server first
      let result = await safeFetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.LOGIN()}`, {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      // If primary server failed, try fallback servers
      if (!result.success && result.isNetworkError) {
        console.log('Primary server failed, trying fallback servers...');
        
        for (const fallbackUrl of API_CONFIG.FALLBACK_URLS) {
          console.log(`Trying fallback server: ${fallbackUrl}`);
          result = await safeFetch(`${fallbackUrl}${API_ENDPOINTS.LOGIN()}`, {
            method: 'POST',
            body: JSON.stringify({
              email: email,
              password: password,
            }),
          });
          
          if (result.success) {
            console.log(`Successfully connected to fallback server: ${fallbackUrl}`);
            break;
          }
        }
      }

      if (result.success) {
        const data = result.data;
        
        // Store the token and user data if provided in the response
        if (data.token) {
          await authUtils.storeToken(data.token);
          console.log('Login successful, token stored');
        }
        
        // Store user data if provided
        if (data.user) {
          await authUtils.storeUserData(data.user);
          
          // Change language if user has a language preference
          if (data.user.language_code) {
            console.log('Login successful, setting user language to:', data.user.language_code);
            await changeLanguage(data.user.language_code);
          }
        }
        
        // Load user navigation after successful login (async, don't wait)
        loadUserNavigation().catch(error => {
          console.error('Error loading user navigation:', error);
          // Navigation loading failed, but login was successful
        });
        
        // Handle FCM token registration after successful login (async, don't wait)
        handleUserLogin().catch(error => {
          console.error('Error handling FCM login:', error);
          // FCM registration failed, but login was successful
        });
        
        showAlert(t('common.success'), t('auth.loginSuccessful'), 'success', () => {
          navigation.replace('Home');
        });
      } else {
        // Handle error cases
        const errorMessage = getErrorMessage(result);
        showAlert(t('auth.loginFailed'), errorMessage, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert(t('auth.connectionError'), error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Logo/Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/rio-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
                tintColor="#003667"
              />
            </View>
            <Text 
              style={styles.welcomeText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('auth.welcomeBack')}
            </Text>
            <Text 
              style={styles.subtitleText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {t('auth.signInToContinue')}
            </Text>
          </View>

          {/* Login Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text 
                style={styles.inputLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('auth.email')}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.enterEmail')}
                placeholderTextColor={UI_CONSTANTS.COLORS.GRAY_DARK}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text 
                style={styles.inputLabel}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('auth.password')}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('auth.enterPassword')}
                  placeholderTextColor={UI_CONSTANTS.COLORS.GRAY_DARK}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={togglePasswordVisibility}
                >
                  <Text style={styles.eyeText}>
                    {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text 
                style={styles.forgotPasswordText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={UI_CONSTANTS.COLORS.PRIMARY} size="small" />
              ) : (
                <Text 
                  style={styles.loginButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t('auth.login')}
                </Text>
              )}
            </TouchableOpacity>

            {/* <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View> */}

            {/* <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity> */}
          </View>

          {/* Footer Section */}
          {/* <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.signUpText}>Sign Up</Text>
            </Text>
          </View> */}
                  </View>
        </KeyboardAvoidingView>
        
        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onConfirm={alertConfig.onConfirm}
          onCancel={alertConfig.onCancel}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />
      </SafeAreaView>
    );
  };

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.container,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: UI_CONSTANTS.SPACING.XXL,
    justifyContent: 'space-between',
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 200,
    height: 80,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: UI_CONSTANTS.COLORS.PRIMARY,
    letterSpacing: 2,
  },
  logoSubText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.XL,
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: -5,
  },
  welcomeText: {
    ...COMMON_STYLES.text.title,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  subtitleText: {
    ...COMMON_STYLES.text.secondary,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.LG,
  },
  inputContainer: {
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },
  inputLabel: {
    ...COMMON_STYLES.text.primary,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },
  textInput: {
    ...COMMON_STYLES.input,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONSTANTS.COLORS.WHITE,
    borderRadius: UI_CONSTANTS.CARD_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: UI_CONSTANTS.COLORS.GRAY_MEDIUM,
    shadowColor: UI_CONSTANTS.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingVertical: UI_CONSTANTS.SPACING.LG,
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.TEXT_PRIMARY,
  },
  eyeButton: {
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    paddingVertical: UI_CONSTANTS.SPACING.LG,
  },
  eyeText: {
    fontSize: UI_CONSTANTS.FONT_SIZES.LG,
    color: UI_CONSTANTS.COLORS.PRIMARY,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: UI_CONSTANTS.SPACING.XXXL,
  },
  forgotPasswordText: {
    color: UI_CONSTANTS.COLORS.PRIMARY,
    fontSize: UI_CONSTANTS.FONT_SIZES.MD,
    fontWeight: '600',
  },
  loginButton: {
    ...COMMON_STYLES.button,
    ...COMMON_STYLES.buttonPrimary,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },
  loginButtonText: {
    ...COMMON_STYLES.text.button,
    color: UI_CONSTANTS.COLORS.PRIMARY,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#7A7A7A',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  socialButtonText: {
    color: '#003667',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#7A7A7A',
    fontSize: 14,
  },
  signUpText: {
    color: '#003667',
    fontWeight: 'bold',
  },
});

export default LoginScreen; 
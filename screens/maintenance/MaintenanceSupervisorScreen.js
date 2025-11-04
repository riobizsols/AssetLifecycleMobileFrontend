import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Appbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { API_CONFIG, getApiHeaders, API_ENDPOINTS, getServerUrl } from '../../config/api';

const MaintenanceSupervisorScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive scaling based on device dimensions, preserving design proportions
  const baseWidth = 375;
  const baseHeight = 812;
  const scale = Math.min(width / baseWidth, 1.4);
  const vScale = Math.min(height / baseHeight, 1.4);
  const moderateScale = (size, factor = 0.5) => size + (scale * size - size) * factor;
  const rs = (n) => Math.round(moderateScale(n));
  const [formData, setFormData] = useState({
    name: 'Rahul',
    phone: '9876543210',
    status: t('maintenance.inProgress'), // Changed to inProgress by default so form is editable
    poNumber: '2344',
    invoice: '32432532535',
    email: 'technician@gmail.com',
    notes: 'it is all working fine',
  });

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [checklistData, setChecklistData] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const statusOptions = [t('maintenance.pending'), t('maintenance.inProgress'), t('maintenance.completed'), t('maintenance.cancelled')];

  const normalizeStatus = (s) => (s || '').toString().toLowerCase().trim();
  const isCompleted =
    normalizeStatus(formData.status) === normalizeStatus(t('maintenance.completed')) ||
    normalizeStatus(formData.status) === 'completed';

  useEffect(() => {
    if (isCompleted) {
      setShowStatusDropdown(false);
    }
  }, [isCompleted]);

  // Memoized responsive overrides to avoid layout thrash
  const responsiveStyles = React.useMemo(() => ({
    appbar: { height: rs(60) },
    content: { paddingHorizontal: rs(16), paddingTop: rs(16) },
    headerCard: { borderRadius: rs(16), padding: rs(20), marginBottom: rs(20) },
    headerIconContainer: { width: rs(56), height: rs(56), borderRadius: rs(28), marginRight: rs(16) },
    headerTitle: { fontSize: rs(20) },
    headerSubtitle: { fontSize: rs(14) },
    quickActionsContainer: { marginBottom: rs(20), gap: rs(12) },
    quickActionCard: { borderRadius: rs(12), padding: rs(16) },
    quickActionIcon: { width: rs(48), height: rs(48), borderRadius: rs(24), marginBottom: rs(8) },
    quickActionText: { fontSize: rs(12) },
    formSection: { borderRadius: rs(16), padding: rs(20) },
    formHeader: { marginBottom: rs(24), paddingBottom: rs(16) },
    formTitle: { fontSize: rs(18), marginLeft: rs(12) },
    inputGroup: { marginBottom: rs(20) },
    inputLabel: { fontSize: rs(14), marginBottom: rs(10) },
    textInput: { borderRadius: rs(10), paddingHorizontal: rs(16), paddingVertical: rs(14), fontSize: rs(16) },
    notesInput: { height: rs(100), paddingTop: rs(14) },
    dropdownButton: { borderRadius: rs(10), paddingHorizontal: rs(16), paddingVertical: rs(14) },
    dropdownButtonText: { fontSize: rs(16) },
    dropdownOptions: { borderRadius: rs(10), marginTop: rs(4) },
    dropdownOption: { paddingHorizontal: rs(16), paddingVertical: rs(14) },
    dropdownOptionText: { fontSize: rs(16) },
    buttonContainer: { marginTop: rs(32), gap: rs(12) },
    cancelButton: { borderRadius: rs(10), paddingVertical: rs(16) },
    cancelButtonText: { fontSize: rs(16), marginLeft: rs(8) },
    submitButton: { borderRadius: rs(10), paddingVertical: rs(16) },
    submitButtonText: { fontSize: rs(16), marginLeft: rs(8) },
    checklistSection: { borderRadius: rs(16), padding: rs(20), marginBottom: rs(20) },
    checklistHeader: { marginBottom: rs(16), paddingBottom: rs(12) },
    checklistTitle: { fontSize: rs(18), marginLeft: rs(12) },
    checklistItem: { borderRadius: rs(12), padding: rs(16), marginBottom: rs(12), borderLeftWidth: Math.max(2, Math.round(rs(4))) },
    checklistItemTitle: { fontSize: rs(16) },
    checklistItemDescription: { fontSize: rs(14), lineHeight: rs(20), marginBottom: rs(8) },
    checklistItemInstructions: { fontSize: rs(13), lineHeight: rs(18) },
    emptyChecklist: { padding: rs(32) },
    emptyChecklistText: { fontSize: rs(16), marginTop: rs(16) },
    iconSize: rs(24),
    iconSizeLarge: rs(32),
    iconSizeSmall: rs(20),
    iconSizeMedium: rs(48),
  }), [width, height]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch checklist data by asset type
  const fetchChecklistData = async (assetTypeId = 1) => {
    try {
      setLoadingChecklist(true);
      
      const serverUrl = getServerUrl();
      const endpoint = API_ENDPOINTS.GET_CHECKLIST_BY_ASSET_TYPE(assetTypeId);
      const url = `${serverUrl}${endpoint}`;

      console.log('Fetching checklist data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Checklist API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Checklist data fetched successfully:', data);
      console.log('Full API response structure:', JSON.stringify(data, null, 2));
      
      // Handle different response structures
      let checklistArray = [];
      if (data.success && data.data) {
        checklistArray = data.data;
        console.log('Using data.success && data.data structure, found', checklistArray.length, 'items');
      } else if (data.data && Array.isArray(data.data)) {
        checklistArray = data.data;
        console.log('Using data.data array structure, found', checklistArray.length, 'items');
      } else if (Array.isArray(data)) {
        checklistArray = data;
        console.log('Using direct array structure, found', checklistArray.length, 'items');
      } else {
        console.warn('Unexpected checklist API response structure:', data);
        console.log('Available keys in response:', Object.keys(data));
        checklistArray = [];
      }
      
      console.log('Final checklist array:', checklistArray);
      setChecklistData(checklistArray);
      setShowChecklist(true);
    } catch (error) {
      console.error('Error fetching checklist data:', error);
      Alert.alert(
        t('maintenance.error') || 'Error',
        t('maintenance.failedToLoadChecklist') || 'Failed to load checklist data. Please try again.',
        [{ text: t('common.ok') || 'OK' }]
      );
    } finally {
      setLoadingChecklist(false);
    }
  };

  const handleViewChecklist = () => {
    // Using asset type ID AT010 as specified
    fetchChecklistData('AT010');
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Form submitted:', formData);
    // You can add API call here
    alert(t('maintenance.maintenanceScheduleUpdatedSuccessfully'));
  };

  const handleCancel = () => {
    // Reset form or navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.rootSafeArea} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#003667" />
      <View style={styles.container}>
        {/* AppBar inside safe area */}
        <Appbar.Header style={[styles.appbar, responsiveStyles.appbar]} statusBarHeight={0}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={responsiveStyles.iconSize} color="#FEC200" />
          </TouchableOpacity>
          <View style={styles.centerTitleContainer}>
            <Text style={styles.appbarTitle}>{t('maintenance.maintenanceSupervisor')}</Text>
          </View>
        </Appbar.Header>

        <ScrollView
          style={[styles.content, responsiveStyles.content]}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, rs(16)) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header Card */}
        <View style={[styles.headerCard, responsiveStyles.headerCard]}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIconContainer, responsiveStyles.headerIconContainer]}>
              <MaterialCommunityIcons name="wrench" size={responsiveStyles.iconSizeLarge} color="#fff" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, responsiveStyles.headerTitle]}>{t('maintenance.maintenanceSupervisor')}</Text>
              <Text style={[styles.headerSubtitle, responsiveStyles.headerSubtitle]}>{t('maintenance.scheduleManagement')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.quickActionsContainer, responsiveStyles.quickActionsContainer]}>
          <TouchableOpacity 
            style={[styles.quickActionCard, responsiveStyles.quickActionCard]} 
            activeOpacity={0.8}
            onPress={handleViewChecklist}
            disabled={loadingChecklist}
          >
            <View style={[styles.quickActionIcon, responsiveStyles.quickActionIcon]}>
              {loadingChecklist ? (
                <ActivityIndicator size="small" color="#003667" />
              ) : (
                <MaterialCommunityIcons name="clipboard-check-outline" size={responsiveStyles.iconSize} color="#003667" />
              )}
            </View>
            <Text style={[styles.quickActionText, responsiveStyles.quickActionText]}>
              {loadingChecklist ? t('common.loading') || 'Loading...' : t('maintenance.viewChecklist')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Checklist Section */}
        {showChecklist && (
          <View style={[styles.checklistSection, responsiveStyles.checklistSection]}>
            <View style={[styles.checklistHeader, responsiveStyles.checklistHeader]}>
              <MaterialCommunityIcons name="clipboard-list" size={responsiveStyles.iconSize} color="#003667" />
              <Text style={[styles.checklistTitle, responsiveStyles.checklistTitle]}>{t('maintenance.checklist') || 'Checklist'}</Text>
              <TouchableOpacity 
                onPress={() => setShowChecklist(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={responsiveStyles.iconSizeSmall} color="#666" />
              </TouchableOpacity>
            </View>
            
            {checklistData.length > 0 ? (
              <View style={styles.checklistContent}>
                {checklistData.map((item, index) => (
                  <View key={index} style={[styles.checklistItem, responsiveStyles.checklistItem]}>
                    <View style={styles.checklistItemHeader}>
                      <Text style={[styles.checklistItemTitle, responsiveStyles.checklistItemTitle]}>
                        {item.item || item.title || item.name || item.checklist_item || `Item ${index + 1}`}
                      </Text>
                    </View>
                    {item.description && (
                      <Text style={[styles.checklistItemDescription, responsiveStyles.checklistItemDescription]}>
                        {item.description}
                      </Text>
                    )}
                    {item.instructions && (
                      <Text style={[styles.checklistItemInstructions, responsiveStyles.checklistItemInstructions]}>
                        Instructions: {item.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyChecklist, responsiveStyles.emptyChecklist]}>
                <MaterialCommunityIcons name="clipboard-outline" size={48} color="#ccc" />
                <Text style={[styles.emptyChecklistText, responsiveStyles.emptyChecklistText]}>
                  {t('maintenance.noChecklistItems') || 'No checklist items found'}
                </Text>
                {/* Debug info - remove this after fixing */}
                <Text style={[styles.emptyChecklistText, { fontSize: rs(12), marginTop: rs(8) }]}>
                  Debug: API called with assetTypeId=AT010
                </Text>
                <Text style={[styles.emptyChecklistText, { fontSize: rs(12) }]}>
                  Check console logs for API response details
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Form Section */}
        <View style={[styles.formSection, responsiveStyles.formSection]}>
          <View style={[styles.formHeader, responsiveStyles.formHeader]}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={responsiveStyles.iconSize} color="#003667" />
            <Text style={[styles.formTitle, responsiveStyles.formTitle]}>{t('maintenance.updateSchedule')}</Text>
          </View>
          
          <View style={styles.form}>
            {/* Name Field */}
            <View style={[styles.inputGroup, responsiveStyles.inputGroup]}>
              <Text style={styles.inputLabel}>{t('maintenance.name')}</Text>
              <TextInput
                style={[styles.textInput, responsiveStyles.textInput, isCompleted && styles.disabledInput]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder={t('maintenance.enterName')}
                editable={!isCompleted}
              />
            </View>

            {/* Phone Field */}
            <View style={[styles.inputGroup, responsiveStyles.inputGroup]}>
              <Text style={styles.inputLabel}>{t('maintenance.phone')}</Text>
              <TextInput
                style={[styles.textInput, responsiveStyles.textInput, isCompleted && styles.disabledInput]}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder={t('maintenance.enterPhoneNumber')}
                keyboardType="phone-pad"
                editable={!isCompleted}
              />
            </View>

            {/* Status Field */}
            <View style={[styles.inputGroup, responsiveStyles.inputGroup]}>
              <Text style={styles.inputLabel}>{t('maintenance.status')}</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, responsiveStyles.dropdownButton, isCompleted && styles.disabledInput]}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isCompleted}
              >
                <Text style={[styles.dropdownButtonText, responsiveStyles.dropdownButtonText]}>{formData.status}</Text>
                <Ionicons 
                  name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
                  size={responsiveStyles.iconSizeSmall} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showStatusDropdown && (
                <View style={[styles.dropdownOptions, responsiveStyles.dropdownOptions]}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.dropdownOption, responsiveStyles.dropdownOption]}
                      onPress={() => {
                        handleInputChange('status', option);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownOptionText, responsiveStyles.dropdownOptionText]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* PO Number Field */}
            <View style={[styles.inputGroup, responsiveStyles.inputGroup]}>
              <Text style={styles.inputLabel}>{t('maintenance.poNumber')}</Text>
              <TextInput
                style={[styles.textInput, responsiveStyles.textInput, isCompleted && styles.disabledInput]}
                value={formData.poNumber}
                onChangeText={(value) => handleInputChange('poNumber', value)}
                placeholder={t('maintenance.enterPoNumber')}
                editable={!isCompleted}
              />
            </View>

            {/* Invoice Field */}
            <View style={[styles.inputGroup, responsiveStyles.inputGroup]}>
              <Text style={styles.inputLabel}>{t('maintenance.invoice')}</Text>
              <TextInput
                style={[styles.textInput, responsiveStyles.textInput, isCompleted && styles.disabledInput]}
                value={formData.invoice}
                onChangeText={(value) => handleInputChange('invoice', value)}
                placeholder={t('maintenance.enterInvoiceNumber')}
                editable={!isCompleted}
              />
            </View>

            {/* Email Field */}
            <View style={[styles.inputGroup, responsiveStyles.inputGroup]}>
              <Text style={styles.inputLabel}>{t('maintenance.email')}</Text>
              <TextInput
                style={[styles.textInput, responsiveStyles.textInput, isCompleted && styles.disabledInput]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder={t('maintenance.enterEmail')}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isCompleted}
              />
            </View>

            {/* Notes Field */}
            <View style={[styles.inputGroup, responsiveStyles.inputGroup]}>
              <Text style={styles.inputLabel}>{t('maintenance.notes')}</Text>
              <TextInput
                style={[styles.textInput, responsiveStyles.textInput, styles.notesInput, responsiveStyles.notesInput, isCompleted && styles.disabledInput]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder={t('maintenance.enterNotes')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isCompleted}
              />
            </View>

            {/* Action Buttons */}
            <View style={[styles.buttonContainer, responsiveStyles.buttonContainer]}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={20} color="#666" />
                <Text style={[styles.cancelButtonText, responsiveStyles.cancelButtonText]}>{t('maintenance.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitButton, responsiveStyles.submitButton, isCompleted && styles.submitButtonDisabled]} onPress={handleSubmit} activeOpacity={0.8} disabled={isCompleted}>
                <MaterialCommunityIcons name="check" size={responsiveStyles.iconSizeSmall} color="#fff" />
                <Text style={[styles.submitButtonText, responsiveStyles.submitButtonText]}>{t('maintenance.submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rootSafeArea: {
    flex: 1,
    backgroundColor: '#003667',
  },
  container: {
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  appbar: {
    backgroundColor: '#003667',
    elevation: 0,
    shadowOpacity: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  backButton: {
    padding: 12,
    marginLeft: 8,
    zIndex: 2,
  },
  centerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  appbarTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerCard: {
    backgroundColor: '#003667',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003667',
    marginLeft: 12,
  },
  form: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  notesInput: {
    height: 100,
    paddingTop: 14,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginTop: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003667',
    borderRadius: 10,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#7A90A8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  checklistSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003667',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  checklistContent: {
    marginTop: 8,
  },
  checklistItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#003667',
  },
  checklistItemHeader: {
    marginBottom: 8,
  },
  checklistItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  checklistItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  checklistItemInstructions: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  emptyChecklist: {
    alignItems: 'center',
    padding: 32,
  },
  emptyChecklistText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MaintenanceSupervisorScreen;

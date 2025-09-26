import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const MaintenanceSupervisorScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: 'Rahul',
    phone: '9876543210',
    status: t('maintenance.completed'),
    poNumber: '2344',
    invoice: '32432532535',
    email: 'technician@gmail.com',
    notes: 'it is all working fine',
  });

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusOptions = [t('maintenance.pending'), t('maintenance.inProgress'), t('maintenance.completed'), t('maintenance.cancelled')];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* AppBar */}
      <Appbar.Header style={styles.appbar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FEC200" />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>{t('maintenance.maintenanceSupervisor')}</Text>
        </View>
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="wrench" size={32} color="#fff" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t('maintenance.maintenanceSupervisor')}</Text>
              <Text style={styles.headerSubtitle}>{t('maintenance.scheduleManagement')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#003667" />
            </View>
            <Text style={styles.quickActionText}>{t('maintenance.viewChecklist')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
            <View style={styles.quickActionIcon}>
              <MaterialCommunityIcons name="history" size={24} color="#003667" />
            </View>
            <Text style={styles.quickActionText}>{t('maintenance.history')}</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.formHeader}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#003667" />
            <Text style={styles.formTitle}>{t('maintenance.updateSchedule')}</Text>
          </View>
          
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('maintenance.name')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder={t('maintenance.enterName')}
              />
            </View>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('maintenance.phone')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder={t('maintenance.enterPhoneNumber')}
                keyboardType="phone-pad"
              />
            </View>

            {/* Status Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('maintenance.status')}</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={styles.dropdownButtonText}>{formData.status}</Text>
                <Ionicons 
                  name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showStatusDropdown && (
                <View style={styles.dropdownOptions}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        handleInputChange('status', option);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* PO Number Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('maintenance.poNumber')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.poNumber}
                onChangeText={(value) => handleInputChange('poNumber', value)}
                placeholder={t('maintenance.enterPoNumber')}
              />
            </View>

            {/* Invoice Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('maintenance.invoice')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.invoice}
                onChangeText={(value) => handleInputChange('invoice', value)}
                placeholder={t('maintenance.enterInvoiceNumber')}
              />
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('maintenance.email')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder={t('maintenance.enterEmail')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Notes Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('maintenance.notes')}</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder={t('maintenance.enterNotes')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={20} color="#666" />
                <Text style={styles.cancelButtonText}>{t('maintenance.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>{t('maintenance.submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MaintenanceSupervisorScreen;

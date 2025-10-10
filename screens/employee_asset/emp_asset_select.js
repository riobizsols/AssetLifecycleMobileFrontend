import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { API_CONFIG, getApiHeaders, API_ENDPOINTS } from "../../config/api";

const { width, height } = Dimensions.get('window');

// Responsive design breakpoints
const BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 375,
  LARGE: 414,
  TABLET: 768,
  DESKTOP: 1024,
};

// Device type detection
const getDeviceType = () => {
  if (width >= BREAKPOINTS.DESKTOP) return 'desktop';
  if (width >= BREAKPOINTS.TABLET) return 'tablet';
  if (width >= BREAKPOINTS.LARGE) return 'large';
  if (width >= BREAKPOINTS.MEDIUM) return 'medium';
  return 'small';
};

const DEVICE_TYPE = getDeviceType();

// Responsive scaling functions
const scale = (size) => {
  const scaleFactor = width / BREAKPOINTS.MEDIUM;
  return Math.max(size * scaleFactor, size * 0.8);
};

const verticalScale = (size) => {
  const scaleFactor = height / 812;
  return Math.max(size * scaleFactor, size * 0.8);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Responsive UI constants
const RESPONSIVE_CONSTANTS = {
  SPACING: {
    XS: scale(4),
    SM: scale(8),
    MD: scale(12),
    LG: scale(16),
    XL: scale(20),
    XXL: scale(24),
  },
  
  FONT_SIZES: {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(20),
  },
  
  INPUT_HEIGHT: verticalScale(45),
  BUTTON_HEIGHT: verticalScale(40),
  LABEL_WIDTH: scale(120),
  CARD_BORDER_RADIUS: scale(8),
  MODAL_BORDER_RADIUS: scale(12),
  
  getModalWidth: () => {
    if (DEVICE_TYPE === 'desktop') return '60%';
    if (DEVICE_TYPE === 'tablet') return '75%';
    return '90%';
  },
  
  getModalHeight: () => {
    if (DEVICE_TYPE === 'desktop') return '60%';
    if (DEVICE_TYPE === 'tablet') return '65%';
    return '70%';
  },
};

export default function EmployeeAssetSelect() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { employeeId, employeeName } = route.params || {};
  
  const [selectedAssetType, setSelectedAssetType] = useState("");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [showAssetTypeDropdown, setShowAssetTypeDropdown] = useState(false);
  const [assetTypeSearchText, setAssetTypeSearchText] = useState("");
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  
  // Asset selection states
  const [selectedAsset, setSelectedAsset] = useState("");
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [assetSearchText, setAssetSearchText] = useState("");

  // Fetch asset types
  const fetchAssetTypes = async () => {
    setLoadingAssetTypes(true);
    try {
      const url = `${API_CONFIG.BASE_URL}/api/asset-types/assignment-type/user`;
      console.log('Fetching asset types:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Asset types data received:', data);
      
      // Transform the data to match our component structure
      // Using asset_type_id as key and text as value
      const transformedAssetTypes = data.map(item => ({
        id: item.asset_type_id,
        name: item.text,
        description: item.text // Using text as description for now
      }));
      
      setAssetTypes(transformedAssetTypes);
    } catch (error) {
      console.error("Error fetching asset types:", error);
      Alert.alert(t('common.error'), t('assets.failedToLoadAssetTypes'));
      // Fallback to mock data for testing
      const mockAssetTypes = [
        { id: "1", name: "Laptop", description: "Portable computers" },
        { id: "2", name: "Desktop", description: "Desktop computers" },
        { id: "3", name: "Monitor", description: "Display screens" },
        { id: "4", name: "Keyboard", description: "Input devices" },
        { id: "5", name: "Mouse", description: "Pointing devices" },
        { id: "6", name: "Printer", description: "Printing devices" },
        { id: "7", name: "Scanner", description: "Scanning devices" },
        { id: "8", name: "Phone", description: "Communication devices" },
        { id: "9", name: "Tablet", description: "Portable tablets" },
        { id: "10", name: "Server", description: "Server computers" },
      ];
      setAssetTypes(mockAssetTypes);
    } finally {
      setLoadingAssetTypes(false);
    }
  };

  // Filter asset types based on search text
  const getFilteredAssetTypes = () => {
    const filtered = !assetTypeSearchText ? assetTypes : assetTypes.filter(type => 
      type.name.toLowerCase().includes(assetTypeSearchText.toLowerCase()) ||
      type.description.toLowerCase().includes(assetTypeSearchText.toLowerCase())
    );
    console.log('Filtered asset types:', filtered.length, filtered);
    return filtered;
  };

  // Filter assets based on search text
  const getFilteredAssets = () => {
    const filtered = !assetSearchText ? assets : assets.filter(asset => 
      asset.serial_number.toLowerCase().includes(assetSearchText.toLowerCase()) ||
      asset.description.toLowerCase().includes(assetSearchText.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(assetSearchText.toLowerCase())
    );
    console.log('Filtered assets:', filtered.length, filtered);
    return filtered;
  };

  // Fetch inactive assets by asset type
  const fetchInactiveAssets = async (assetTypeId) => {
    if (!assetTypeId) {
      console.log('No asset type ID provided');
      return;
    }

    setLoading(true);
    setSearchPerformed(true);
    
    try {
      // Call API to get inactive assets by asset type
      const url = `${API_CONFIG.BASE_URL}/api/assets/type/${assetTypeId}/inactive`;
      console.log('Fetching inactive assets for type:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response status:', response.status);
        console.log('API Response data type:', typeof data);
        console.log('API Response data:', data);
        console.log('Is data an array?', Array.isArray(data));
        console.log('Data length:', data ? data.length : 'undefined');
        
        // Check if data is an array and not empty
        let assetsArray = data;
        
        // Handle different possible response formats
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // If data is an object, check for common property names
          if (data.assets && Array.isArray(data.assets)) {
            assetsArray = data.assets;
          } else if (data.data && Array.isArray(data.data)) {
            assetsArray = data.data;
          } else if (data.results && Array.isArray(data.results)) {
            assetsArray = data.results;
          } else {
            console.log('Data is an object but no array found in common properties:', data);
            assetsArray = [];
          }
        } else if (data && Array.isArray(data)) {
          assetsArray = data;
        } else {
          console.log('No data or data is not an array:', data);
          assetsArray = [];
        }
        
        if (assetsArray && assetsArray.length > 0) {
          // Transform the data to match our display format
          const transformedAssets = assetsArray.map(asset => ({
            asset_id: asset.asset_id || asset.id || asset.assetId,
            serial_number: asset.serial_number || asset.serialNumber || asset.serial,
            description: asset.description || asset.text || asset.name || t('assets.unknownAsset'),
            status: asset.status || 'Inactive',
            type: asset.asset_type_id || asset.assetTypeId || asset.type
          }));
          
          setAssets(transformedAssets);
        } else {
          console.log('No assets found in array:', assetsArray);
          setAssets([]);
          Alert.alert(t('assets.noInactiveAssetsFound'), t('assets.noInactiveAssetsFoundMessage'));
        }
      } else if (response.status === 404) {
        setAssets([]);
        Alert.alert(t('assets.noInactiveAssetsFound'), t('assets.noInactiveAssetsFoundMessage'));
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching inactive assets:", error);
      Alert.alert(t('common.error'), t('assets.failedToFetchInactiveAssets'));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Search assets by asset type (keeping for backward compatibility)
  const searchAssets = async () => {
    if (!selectedAssetType) {
      Alert.alert(t('common.error'), t('assets.pleaseSelectAssetType'));
      return;
    }

    // Use the new fetchInactiveAssets function
    await fetchInactiveAssets(selectedAssetType);
  };

  // Select an asset for assignment
  const selectAsset = (asset) => {
    Alert.alert(
      t('assets.selectAsset'),
      `${t('assets.doYouWantToAssign')} ${asset.description} (${asset.serial_number}) ${t('assets.to')} ${employeeName || employeeId}?`,
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('assets.selectAsset'),
          onPress: () => {
            // Navigate to assignment page with selected asset
            navigation.navigate('EmployeeAssetAssignment', {
              assetId: asset.asset_id,
              barcode: asset.serial_number,
              assetData: asset,
              employeeId: employeeId,
              employeeName: employeeName
            });
          }
        }
      ]
    );
  };

  // Remove automatic fetch - now we fetch only when dropdown is clicked

  // Custom searchable dropdown component
  const renderSearchableDropdown = (
    value, 
    setValue, 
    options, 
    placeholder, 
    searchText, 
    setSearchText, 
    showDropdown, 
    setShowDropdown
  ) => {
    const selectedOption = options.find(option => option.id === value);
    const displayText = selectedOption ? selectedOption.name : placeholder;

    return (
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            // Fetch asset types when dropdown is opened
            if (!showDropdown) {
              fetchAssetTypes();
            }
            setShowDropdown(!showDropdown);
          }}
        >
          <Text style={styles.dropdownButtonText}>
            {displayText}
          </Text>
          <Icon 
            name={showDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
            size={22} 
            color="#888" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Render asset item
  const renderAssetItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.assetItem,
        { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" }
      ]}
      onPress={() => selectAsset(item)}
    >
      <View style={styles.assetInfo}>
        <Text style={styles.assetName}>{item.description}</Text>
        <Text style={styles.assetSerial}>{t('assets.serial')} {item.serial_number}</Text>
        <Text style={styles.assetStatus}>{t('assets.status')} {item.status}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="#003667"
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#003667"
        translucent={Platform.OS === 'android'}
      />
      {/* AppBar */}
      <View style={styles.appbar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color="#FEC200" 
          />
        </TouchableOpacity>
        <View style={styles.centerTitleContainer}>
          <Text style={styles.appbarTitle}>{t('assets.selectAsset')}</Text>
        </View>
      </View>
      
      <View style={styles.contentContainer}>

      {/* Employee Info */}
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeInfoTitle}>{t('assets.employeeInformation')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('employees.employeeId')}:</Text>
          <Text style={styles.value}>{employeeId || t('common.notAvailable')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('employees.employeeName')}:</Text>
          <Text style={styles.value}>{employeeName || t('common.notAvailable')}</Text>
        </View>
      </View>

      {/* Search Section */}
                  <View style={styles.searchContainer}>
              <Text style={styles.searchTitle}>{t('assets.selectAssetType')}</Text>
        <View style={styles.searchRow}>
          {loadingAssetTypes ? (
            <View style={styles.dropdownWrapper}>
              <ActivityIndicator size="small" color="#003667" />
              <Text style={{ marginLeft: 8, color: "#616161" }}>{t('assets.loading')}</Text>
            </View>
          ) : (
            renderSearchableDropdown(
              selectedAssetType,
              setSelectedAssetType,
              getFilteredAssetTypes(),
              t('assets.selectAssetTypePlaceholder'),
              assetTypeSearchText,
              setAssetTypeSearchText,
              showAssetTypeDropdown,
              setShowAssetTypeDropdown
            )
          )}
          {/* <TouchableOpacity
            style={styles.searchButton}
            onPress={searchAssets}
            disabled={loading || !selectedAssetType}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FEC200" />
            ) : (
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color="#FEC200"
              />
            )}
          </TouchableOpacity> */}
        </View>
      </View>

            {/* Asset Selection Section */}
      {selectedAssetType && (
        <View style={styles.assetSelectionContainer}>
          <Text style={styles.assetSelectionTitle}>{t('assets.selectAsset')}</Text>
          <View style={styles.assetSelectionRow}>
            {loading ? (
              <View style={styles.dropdownWrapper}>
                <ActivityIndicator size="small" color="#003667" />
                <Text style={{ marginLeft: 8, color: "#616161" }}>{t('assets.loadingAssets')}</Text>
              </View>
            ) : (
              renderSearchableDropdown(
                selectedAsset,
                setSelectedAsset,
                getFilteredAssets(),
                t('assets.selectAssetPlaceholder'),
                assetSearchText,
                setAssetSearchText,
                showAssetDropdown,
                setShowAssetDropdown
              )
            )}
          </View>
        </View>
      )}
      
      {/* Asset Type Selection Modal */}
      <Modal
        visible={showAssetTypeDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAssetTypeDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('assets.selectAssetType')}</Text>
              <TouchableOpacity
                onPress={() => setShowAssetTypeDropdown(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('assets.searchAssetTypes')}
                placeholderTextColor="#888"
                value={assetTypeSearchText}
                onChangeText={setAssetTypeSearchText}
              />
              {assetTypeSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setAssetTypeSearchText("")}
                >
                  <Icon name="close" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Options List */}
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalContentContainer}
            >
              {loadingAssetTypes ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#003667" />
                  <Text style={styles.modalLoadingText}>{t('assets.loadingAssetTypes')}</Text>
                </View>
              ) : getFilteredAssetTypes().length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Text style={styles.modalEmptyText}>{t('assets.noAssetTypesFound')}</Text>
                  <Text style={styles.modalEmptySubtext}>
                    {assetTypeSearchText ? t('assets.tryDifferentSearchTerm') : t('assets.noAssetTypesAvailable')}
                  </Text>
                </View>
              ) : (
                getFilteredAssetTypes().map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalOptionItem,
                      item.id === selectedAssetType && styles.modalSelectedOption
                    ]}
                                      onPress={() => {
                    setSelectedAssetType(item.id);
                    setAssetTypeSearchText("");
                    setShowAssetTypeDropdown(false);
                    // Automatically fetch inactive assets for the selected type
                    fetchInactiveAssets(item.id);
                  }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      item.id === selectedAssetType && styles.modalSelectedOptionText
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={[
                      styles.modalOptionSubtext,
                      item.id === selectedAssetType && styles.modalSelectedOptionSubtext
                    ]}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Asset Selection Modal */}
      <Modal
        visible={showAssetDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAssetDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('assets.selectAsset')}</Text>
              <TouchableOpacity
                onPress={() => setShowAssetDropdown(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder={t('assets.searchAssets')}
                placeholderTextColor="#888"
                value={assetSearchText}
                onChangeText={setAssetSearchText}
              />
              {assetSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setAssetSearchText("")}
                >
                  <Icon name="close" size={16} color="#888" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Options List */}
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalContentContainer}
            >
              {loading ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#003667" />
                  <Text style={styles.modalLoadingText}>{t('assets.loadingAssets')}</Text>
                </View>
              ) : getFilteredAssets().length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Text style={styles.modalEmptyText}>{t('assets.noAssetsFound')}</Text>
                  <Text style={styles.modalEmptySubtext}>
                    {assetSearchText ? t('assets.tryDifferentSearchTerm') : t('assets.noAssetsAvailable')}
                  </Text>
                </View>
              ) : (
                getFilteredAssets().map((item) => (
                  <TouchableOpacity
                    key={item.asset_id}
                    style={[
                      styles.modalOptionItem,
                      item.asset_id === selectedAsset && styles.modalSelectedOption
                    ]}
                    onPress={() => {
                      setSelectedAsset(item.asset_id);
                      setAssetSearchText("");
                      setShowAssetDropdown(false);
                      // Navigate to assignment page with selected asset
                      selectAsset(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      item.asset_id === selectedAsset && styles.modalSelectedOptionText
                    ]}>
                      {item.serial_number}
                    </Text>
                    <Text style={[
                      styles.modalOptionSubtext,
                      item.asset_id === selectedAsset && styles.modalSelectedOptionSubtext
                    ]}>
                      {item.description} - {item.status}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003667",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  appbar: {
    backgroundColor: "#003667",
    height: verticalScale(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    ...Platform.select({
      ios: {
        // iOS handles safe area automatically
      },
      android: {
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  backButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.MD,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    zIndex: 2,
  },
  centerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  appbarTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: "center",
  },
  employeeInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    margin: RESPONSIVE_CONSTANTS.SPACING.LG,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeInfoTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: "600",
    color: "#003667",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.SM,
  },
  label: {
    width: RESPONSIVE_CONSTANTS.LABEL_WIDTH,
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "500",
  },
  value: {
    flex: 1,
    color: "#333",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "400",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: "600",
    color: "#003667",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(4),
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlignVertical: "center",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
  },
  searchButton: {
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.SM,
    backgroundColor: "#003667",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    width: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(6),
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#003667",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  assetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  assetSerial: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  assetStatus: {
    fontSize: 12,
    color: "#003667",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: "#003667",
    fontWeight: "500",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    marginTop: 8,
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  initialContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  initialText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  initialSubtext: {
    marginTop: 8,
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  dropdownWrapper: {
    flex: 1,
    position: "relative",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: scale(4),
    backgroundColor: "#f9f9f9",
    height: RESPONSIVE_CONSTANTS.INPUT_HEIGHT,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  dropdownButtonText: {
    color: "#616161",
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    fontWeight: "400",
    flex: 1,
  },
  dropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownOverlayTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  dropdownList: {
    position: "absolute",
    top: 200,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    maxHeight: 300,
    minHeight: 100,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
  },

  dropdownContentContainer: {
    flexGrow: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: RESPONSIVE_CONSTANTS.MODAL_BORDER_RADIUS,
    width: RESPONSIVE_CONSTANTS.getModalWidth(),
    height: RESPONSIVE_CONSTANTS.getModalHeight(),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.XL,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalSearchInput: {
    flex: 1,
    height: verticalScale(40),
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: "#333",
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: "#f5f5f5",
    borderRadius: scale(6),
  },
  modalScrollView: {
    flex: 1,
    minHeight: 200,
  },
  modalContentContainer: {
    paddingBottom: RESPONSIVE_CONSTANTS.SPACING.LG,
  },
  modalOptionItem: {
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.LG,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalSelectedOption: {
    backgroundColor: "#e3f2fd",
  },
  modalOptionText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#333",
    fontWeight: "500",
  },
  modalSelectedOptionText: {
    color: "#003667",
    fontWeight: "600",
  },
  modalOptionSubtext: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: "#666",
    marginTop: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  modalSelectedOptionSubtext: {
    color: "#003667",
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
  },
  modalLoadingText: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.MD,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.XXL * 1.5,
  },
  modalEmptyText: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    color: "#666",
    fontWeight: "500",
  },
  modalEmptySubtext: {
    marginTop: RESPONSIVE_CONSTANTS.SPACING.SM,
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: "#999",
    textAlign: "center",
  },
  // Asset selection styles
  assetSelectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: RESPONSIVE_CONSTANTS.CARD_BORDER_RADIUS,
    padding: RESPONSIVE_CONSTANTS.SPACING.LG,
    margin: RESPONSIVE_CONSTANTS.SPACING.LG,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assetSelectionTitle: {
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    fontWeight: "600",
    color: "#003667",
    marginBottom: RESPONSIVE_CONSTANTS.SPACING.MD,
  },
  assetSelectionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownSearchInput: {
    flex: 1,
    height: verticalScale(40),
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.MD,
    color: "#333",
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.MD,
    backgroundColor: "transparent",
  },
  clearButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedOption: {
    backgroundColor: "#e3f2fd",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#003667",
    fontWeight: "600",
  },
  optionSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  selectedOptionSubtext: {
    color: "#003667",
  },
});

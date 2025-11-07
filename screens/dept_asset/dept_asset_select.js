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

export default function DepartmentAssetSelect() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { departmentId, departmentName } = route.params || {};
  
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

  // Fetch asset types for department assignment
  const fetchAssetTypes = async () => {
    setLoadingAssetTypes(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ASSET_TYPES_FOR_DEPARTMENT()}`;
      console.log('Fetching asset types for department assignment:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Asset types data received:', data);
      
      // Transform the data to match our component structure
      const transformedAssetTypes = data.map(item => ({
        id: item.asset_type_id,
        name: item.text,
        description: item.text
      }));
      
      setAssetTypes(transformedAssetTypes);
    } catch (error) {
      console.error("Error fetching asset types:", error);
      Alert.alert(t('common.error'), t('assets.failedToLoadAssetTypes'));
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
    return filtered;
  };

  // Filter assets based on search text
  const getFilteredAssets = () => {
    const filtered = !assetSearchText ? assets : assets.filter(asset => 
      asset.serial_number.toLowerCase().includes(assetSearchText.toLowerCase()) ||
      asset.description.toLowerCase().includes(assetSearchText.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(assetSearchText.toLowerCase())
    );
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
      const url = `${API_CONFIG.BASE_URL}/api/assets/type/${assetTypeId}/inactive`;
      console.log('Fetching inactive assets for type:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: await getApiHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response status:', response.status);
        console.log('API Response data:', data);
        
        let assetsArray = data;
        
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (data.assets && Array.isArray(data.assets)) {
            assetsArray = data.assets;
          } else if (data.data && Array.isArray(data.data)) {
            assetsArray = data.data;
          } else if (data.results && Array.isArray(data.results)) {
            assetsArray = data.results;
          } else {
            assetsArray = [];
          }
        } else if (data && Array.isArray(data)) {
          assetsArray = data;
        } else {
          assetsArray = [];
        }
        
        if (assetsArray && assetsArray.length > 0) {
          const transformedAssets = assetsArray.map(asset => ({
            asset_id: asset.asset_id || asset.id || asset.assetId,
            serial_number: asset.serial_number || asset.serialNumber || asset.serial,
            description: asset.description || asset.text || asset.name || t('assets.unknownAsset'),
            status: asset.status || 'Inactive',
            type: asset.asset_type_id || asset.assetTypeId || asset.type
          }));
          
          setAssets(transformedAssets);
        } else {
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

  // Select an asset for assignment
  const selectAsset = (asset) => {
    Alert.alert(
      t('assets.selectAsset'),
      `${t('assets.doYouWantToAssign')} ${asset.description} (${asset.serial_number}) ${t('assets.to')} ${departmentName || departmentId}?`,
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('assets.selectAsset'),
          onPress: () => {
            navigation.navigate('DepartmentAssetAssignment', {
              assetId: asset.asset_id,
              barcode: asset.serial_number,
              assetData: asset,
              departmentId: departmentId,
              departmentName: departmentName
            });
          }
        }
      ]
    );
  };

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

      {/* Department Info */}
      <View style={styles.departmentInfo}>
        <Text style={styles.departmentInfoTitle}>{t('assets.departmentInformation')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('employees.department')}:</Text>
          <Text style={styles.value}>{departmentId || t('common.notAvailable')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('assets.departmentName')}:</Text>
          <Text style={styles.value}>{departmentName || t('common.notAvailable')}</Text>
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
      ios: {},
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
  departmentInfo: {
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
  departmentInfoTitle: {
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
  clearButton: {
    padding: RESPONSIVE_CONSTANTS.SPACING.SM,
    marginLeft: RESPONSIVE_CONSTANTS.SPACING.XS,
  },
});


import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
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
  },
  
  TABLE_CELL_FONT_SIZE: moderateScale(12),
  TABLE_HEADER_FONT_SIZE: moderateScale(13),
  EMPTY_TEXT_FONT_SIZE: moderateScale(16),
  APPBAR_HEIGHT: verticalScale(56),
  TABLE_HEADER_HEIGHT: verticalScale(40),
  TABLE_ROW_HEIGHT: verticalScale(50),
  BORDER_RADIUS: scale(8),
};

export default function EmployeeListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { departmentId, employeeData } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Set employee data when component loads or when employeeData changes
  useEffect(() => {
    if (employeeData && Array.isArray(employeeData)) {
      setEmployees(employeeData);
    } else {
      setEmployees([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeData]);

  return (
    <SafeAreaProvider>
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
            <Text style={styles.appbarTitle}>{t('assets.employeeList')}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Table */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>
                {t('assets.employeeId')}
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                {t('assets.employeeName')}
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
                {t('assets.noOfAssetsAssigned')}
              </Text>
            </View>
            <View style={styles.yellowLine} />

            {employees.length > 0 ? (
              <FlatList
                data={employees}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.tableRow,
                      { backgroundColor: index % 2 === 0 ? "#fff" : "#f0f4f8" },
                    ]}
                  >
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>
                      {item.id}
                    </Text>
                    <TouchableOpacity 
                      style={{ flex: 2 }}
                      onPress={() =>
                        navigation.navigate("Dept_Asset_5", {
                          employeeId: item.id,
                          employeeName: item.name,
                          departmentId: departmentId
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.tableCell,
                          {
                            color: "#003366",
                            textDecorationLine: "underline",
                            textAlign: "center",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          color: "#003366",
                          textAlign: "center",
                          flex: 1.5 
                        },
                      ]}
                    >
                      {item.assets}
                    </Text>
                  </View>
                )}
                ListFooterComponent={<View style={{ height: RESPONSIVE_CONSTANTS.SPACING.XXL * 5 }} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {departmentId
                    ? t('assets.noEmployeesFoundForDepartment')
                    : t('assets.noEmployeeDataAvailable')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003667",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  appbar: {
    backgroundColor: '#003667',
    height: RESPONSIVE_CONSTANTS.APPBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    ...Platform.select({
      ios: {
        // iOS handles safe area automatically
      },
      android: {
        elevation: 4,
        shadowColor: '#000',
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
    color: '#fff',
    fontWeight: '600',
    fontSize: RESPONSIVE_CONSTANTS.FONT_SIZES.LG,
    alignSelf: 'center',
  },
  tableContainer: {
    margin: RESPONSIVE_CONSTANTS.SPACING.SM,
    borderRadius: RESPONSIVE_CONSTANTS.BORDER_RADIUS,
    backgroundColor: "#fff",
    overflow: "hidden",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003366",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    minHeight: RESPONSIVE_CONSTANTS.TABLE_HEADER_HEIGHT,
    alignItems: 'center',
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: RESPONSIVE_CONSTANTS.TABLE_HEADER_FONT_SIZE,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: RESPONSIVE_CONSTANTS.SPACING.SM,
    paddingHorizontal: RESPONSIVE_CONSTANTS.SPACING.SM,
    alignItems: "center",
    minHeight: RESPONSIVE_CONSTANTS.TABLE_ROW_HEIGHT,
  },
  tableCell: {
    fontSize: RESPONSIVE_CONSTANTS.TABLE_CELL_FONT_SIZE,
    fontWeight: "500",
    color: "#616161",
    textAlign: "center",
  },
  yellowLine: {
    height: 3,
    backgroundColor: "#FEC200",
    width: "100%",
  },
  emptyContainer: {
    padding: RESPONSIVE_CONSTANTS.SPACING.XXL * 2.5,
    alignItems: "center",
  },
  emptyText: {
    fontSize: RESPONSIVE_CONSTANTS.EMPTY_TEXT_FONT_SIZE,
    color: "#666",
    textAlign: "center",
  },
});
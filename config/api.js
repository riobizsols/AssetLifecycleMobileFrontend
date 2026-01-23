import { Platform } from 'react-native';

// API Configuration
export const API_CONFIG = {
  // Multiple server options for different environments
  SERVERS: {
    // Local development server
    LOCAL: 'http://localhost:5000',
    // Alternative local IPs (common for different network setups)
    LOCAL_ALT1: 'http://10.0.2.2:4000', // Android emulator
    LOCAL_ALT2: 'http://127.0.0.1:4000', // Localhost alternative
    LOCAL_ALT3: 'http://192.168.0.114:4000', // Network IP (if needed)
    // Production server
    PRODUCTION: 'http://103.27.234.248:5000',
  },

  // Default server to use - Platform specific
  // For production/release builds, use the production server
  // For development, use local server
  BASE_URL: __DEV__
    ? (Platform.OS === 'android'
        ? 'http://192.168.0.114:4000'  // Development: Use your computer's IP for Android
        : 'http://localhost:4000')      // Development: Localhost for iOS
    : 'http://103.27.234.248:5000',     // Production: Production server

  // Fallback servers to try if the main one fails - Platform specific
  FALLBACK_URLS: __DEV__
    ? (Platform.OS === 'android'
        ? [
            'http://192.168.0.114:4000', // Your computer's IP
            'http://10.0.2.2:4000',    // Android emulator localhost
            'http://192.168.1.3:4000', // Alternative network IP
            'http://localhost:4000',   // Localhost fallback
            'http://103.27.234.248:5000', // Production fallback
          ]
        : [
            'http://localhost:4000',
            'http://127.0.0.1:4000',
            'http://103.27.234.248:5000', // Production fallback
          ])
    : [
        'http://103.27.234.248:5000',   // Production primary
        'http://localhost:4000',        // Local fallback (if testing locally)
      ],

  ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiJPUkcwMDEiLCJ1c2VyX2lkIjoiVVNSMDAyIiwiZW1haWwiOiJuYXJlbnJpbzc1NkBnbWFpbC5jb20iLCJqb2Jfcm9sZV9pZCI6bnVsbCwiZW1wX2ludF9pZCI6IkVNUF9JTlRfMDAwMiIsImlhdCI6MTc1OTcyODA2NSwiZXhwIjoxNzYwMzMyODY1fQ.BveUrzctoFiVNtT1CrLqaUjpsXg7kXKILjI327_3FSg',
  TIMEOUT: 8000, // 8 seconds
};

// Function to get the current server URL
export const getServerUrl = () => {
  return API_CONFIG.BASE_URL;
};

// Function to test server connectivity
export const testServerConnection = async (url = null) => {
  const testUrl = url || API_CONFIG.BASE_URL;
  try {
    const response = await fetch(`${testUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.log(`Server test failed for ${testUrl}:`, error.message);
    return false;
  }
};

// Function to find a working server
export const findWorkingServer = async () => {
  const servers = [API_CONFIG.BASE_URL, ...API_CONFIG.FALLBACK_URLS];

  for (const server of servers) {
    console.log(`Testing server: ${server}`);
    const isWorking = await testServerConnection(server);
    if (isWorking) {
      console.log(`Found working server: ${server}`);
      return server;
    }
  }

  throw new Error('No working server found');
};

// API Headers - Now retrieves token from AsyncStorage
export const getApiHeaders = async () => {
  // Import authUtils dynamically to avoid circular dependencies
  const { authUtils } = await import('../utils/auth');
  const token = await authUtils.getToken();

  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
    'Accept': 'application/json',
  };
};

// API Endpoints
export const API_ENDPOINTS = {
  CHECK_SERIAL: (serialNumber) => `/api/assets/serial/${serialNumber}`,
  GET_ASSET_ASSIGNMENT: (assetId) => `/api/asset-assignments/asset/${assetId}`,
  DELETE_ASSET_ASSIGNMENT: (assignmentId) => `/api/asset-assignments/${assignmentId}`,
  UPDATE_ASSET_ASSIGNMENT: (assignmentId) => `/api/asset-assignments/${assignmentId}`,
  GET_ASSET_ASSIGNMENT_HISTORY: (assetId) => `/api/asset-assignments/history/${assetId}`,
  GET_LATEST_ASSET_ASSIGNMENT: (assetId) => `/api/asset-assignments/latest/${assetId}`,
  GET_DEPARTMENTS: () => '/api/departments',
  GET_EMPLOYEES_BY_DEPARTMENT: (deptId) => `/api/employees/department/${deptId}`,
  GET_EMPLOYEES: () => '/api/employees',
  GET_EMPLOYEE: (employeeId) => `/api/employees/${employeeId}`,
  CREATE_ASSET_ASSIGNMENT: () => '/api/asset-assignments',
  GET_EMPLOYEE_ACTIVE_ASSETS: (employeeId) => `/api/asset-assignments/employee/${employeeId}/active`,
  GET_EMPLOYEE_ASSET_HISTORY: (employeeId) => `/api/asset-assignments/employee-history/${employeeId}`,
  GET_ASSET_DETAILS: (assetId) => `/api/assets/${assetId}`,
  GET_BREAKDOWN_REPORTS: () => '/api/reportbreakdown/reports',
  UPDATE_BREAKDOWN_REPORT: (id) => `/api/reportbreakdown/update/${id}`,
  GET_BREAKDOWN_REASON_CODES: (orgId) => `/api/reportbreakdown/reason-codes?org_id=${orgId}`,
  GET_ASSET_TYPES_MAINT_REQUIRED: () => '/api/asset-types/maint-required',
  GET_ASSET_TYPES_FOR_USER: () => '/api/asset-types/assignment-type/user',
  GET_ASSET_TYPES_FOR_DEPARTMENT: () => '/api/asset-types/assignment-type/department',
  GET_ASSETS_BY_TYPE: (assetTypeId) => `/api/assets/type/${assetTypeId}`,
  GET_UPCOMING_MAINTENANCE: (assetId) => `/api/reportbreakdown/upcoming-maintenance/${assetId}`,
  CREATE_BREAKDOWN_REPORT: () => '/api/reportbreakdown/create',
  LOGIN: () => '/api/auth/login',
  HEALTH: () => '/api/health',
  GET_MAINTENANCE_SCHEDULES: () => '/api/maintenance-schedules/all',
  GET_CHECKLIST_BY_ASSET_TYPE: (assetTypeId) => `/api/checklist/asset-type/${assetTypeId}`,
  GET_WORK_ORDERS: () => '/api/work-orders/all',
  GET_ASSET_USAGE_ASSETS: () => '/api/asset-usage/assets',
  RECORD_ASSET_USAGE: () => '/api/asset-usage',
  GET_ASSET_USAGE_HISTORY: (assetId) => `/api/asset-usage/${assetId}/history`,
};

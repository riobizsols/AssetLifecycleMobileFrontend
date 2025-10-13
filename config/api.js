import { Platform } from 'react-native';

// API Configuration
export const API_CONFIG = {
  // Multiple server options for different environments
  SERVERS: {
    // Local development server (your computer's IP)
    LOCAL: 'http://192.168.0.101:4000',
    // Alternative local IPs (common for different network setups)
    LOCAL_ALT1: 'http://10.0.2.2:4000', // Android emulator
    LOCAL_ALT2: 'http://localhost:4000', // iOS simulator
    LOCAL_ALT3: 'http://127.0.0.1:4000', // Localhost
    // Production server (replace with your actual production URL)
    PRODUCTION: 'http://103.27.234.248:5000',
  },

  // Default server to use - Platform specific
  BASE_URL: Platform.OS === 'android' 
    ? 'http://192.168.0.101:4000'  // Use actual IP for Android (works for both emulator and physical device on same network)
    : 'http://localhost:4000',      // Use localhost for iOS

  // Fallback servers to try if the main one fails - Platform specific
  FALLBACK_URLS: Platform.OS === 'android'
    ? [
        'http://10.0.2.2:4000',      // Android emulator fallback
        'http://192.168.0.101:4000', // Local network IP
      ]
    : [
        'http://localhost:4000',
        'http://127.0.0.1:4000',
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
  LOGIN: () => '/api/auth/login',
  HEALTH: () => '/api/health',
  GET_MAINTENANCE_SCHEDULES: () => '/api/maintenance-schedules/all',
  GET_CHECKLIST_BY_ASSET_TYPE: (assetTypeId) => `/api/checklist/asset-type/${assetTypeId}`,
};

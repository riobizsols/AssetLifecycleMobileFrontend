import { Platform } from 'react-native';

// Development server settings (ALM-tenant backend: npm run dev → port 5001)
// - Android emulator should use 10.0.2.2
// - Physical Android device should use your computer's LAN IP (same WiFi)
const DEV_BACKEND_PORT = 5001;
const DEV_ANDROID_LAN_URL = `http://192.168.1.4:${DEV_BACKEND_PORT}`;
const DEV_ANDROID_EMULATOR_URL = `http://10.0.2.2:${DEV_BACKEND_PORT}`;
const TENANT_PROD_BASE_URL = 'https://rioassetmanagement.net';

const DEV_ALLOW_PRODUCTION_FALLBACK = false; // set true only if you want to fall back to production in dev

// API Configuration
export const API_CONFIG = {
  // Multiple server options for different environments
  SERVERS: {
    // Local development server
    LOCAL: `http://localhost:${DEV_BACKEND_PORT}`,
    // Alternative local IPs (common for different network setups)
    LOCAL_ALT1: DEV_ANDROID_EMULATOR_URL, // Android emulator
    LOCAL_ALT2: `http://127.0.0.1:${DEV_BACKEND_PORT}`, // Localhost alternative
    LOCAL_ALT3: DEV_ANDROID_LAN_URL, // Network IP (if needed)
    // Production: multi-tenant ALM API (not web.* main ALM)
    PRODUCTION: TENANT_PROD_BASE_URL,
  },

  // Default server to use - Platform specific
  // For production/release builds, use the production server
  // For development, use local server
  BASE_URL: __DEV__
    ? (Platform.OS === 'android'
        ? DEV_ANDROID_EMULATOR_URL     // Development: Android emulator → host port 5001
        : `http://localhost:${DEV_BACKEND_PORT}`)     // Development: iOS simulator
    : TENANT_PROD_BASE_URL,            // Production: tenant API (rioassetmanagement.net)

  // Fallback servers to try if the main one fails - Platform specific
  FALLBACK_URLS: __DEV__
    ? (Platform.OS === 'android'
        ? [
            DEV_ANDROID_EMULATOR_URL,  // Android emulator host loopback
            DEV_ANDROID_LAN_URL,       // Your computer's IP (physical device/same WiFi)
            `http://localhost:${DEV_BACKEND_PORT}`,
            TENANT_PROD_BASE_URL,        // Production fallback (tenant)
          ]
        : [
            `http://localhost:${DEV_BACKEND_PORT}`,
            `http://127.0.0.1:${DEV_BACKEND_PORT}`,
            TENANT_PROD_BASE_URL,      // Production fallback (tenant)
          ])
    : [
        TENANT_PROD_BASE_URL,            // Production primary (tenant API)
      ],

  ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiJPUkcwMDEiLCJ1c2VyX2lkIjoiVVNSMDAyIiwiZW1haWwiOiJuYXJlbnJpbzc1NkBnbWFpbC5jb20iLCJqb2Jfcm9sZV9pZCI6bnVsbCwiZW1wX2ludF9pZCI6IkVNUF9JTlRfMDAwMiIsImlhdCI6MTc1OTcyODA2NSwiZXhwIjoxNzYwMzMyODY1fQ.BveUrzctoFiVNtT1CrLqaUjpsXg7kXKILjI327_3FSg',
  TIMEOUT: 8000, // 8 seconds
};

const normalizeBaseUrl = (url) => (url || '').replace(/\/+$/, '');

// Function to get the current server URL
export const getServerUrl = () => {
  return normalizeBaseUrl(API_CONFIG.BASE_URL);
};

// Update the active server URL at runtime (e.g., after a fallback succeeds)
export const setServerUrl = (url) => {
  const nextUrl = normalizeBaseUrl(url);
  if (!nextUrl) {
    return;
  }

  if (nextUrl !== API_CONFIG.BASE_URL) {
    console.log('Switching active API server to:', nextUrl);
    API_CONFIG.BASE_URL = nextUrl;
  }
};

// Function to test server connectivity
export const testServerConnection = async (url = null) => {
  const testUrl = url || API_CONFIG.BASE_URL;
  try {
    const response = await Promise.race([
      fetch(`${testUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      ),
    ]);
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
  GET_ASSETS_COUNT: () => '/api/assets/count',
  GET_BREAKDOWN_REPORTS: () => '/api/reportbreakdown/reports',
  UPDATE_BREAKDOWN_REPORT: (id) => `/api/reportbreakdown/update/${id}`,
  GET_BREAKDOWN_REASON_CODES: (orgId) => `/api/reportbreakdown/reason-codes?org_id=${orgId}`,
  CREATE_BREAKDOWN_REASON_CODE: () => '/api/breakdown-reason-codes',
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

  /** In-app + web notification feed (maintenance, inspection, warranty, etc.) */
  USER_NOTIFICATIONS: (empIntId) => `/api/notifications/user/${empIntId}`,
  WARRANTY_NOTIFICATION_OPEN: (notifyId) => `/api/notifications/warranty/${notifyId}/open`,
  WARRANTY_NOTIFICATION_DISCARD: (notifyId) => `/api/notifications/warranty/${notifyId}/discard`,
  WARRANTY_NOTIFICATION_SNOOZE: (notifyId) => `/api/notifications/warranty/${notifyId}/snooze`,
  EXPIRY_NOTIFICATION_OPEN: (notifyId) => `/api/notifications/expiry/${notifyId}/open`,
  EXPIRY_NOTIFICATION_DISCARD: (notifyId) => `/api/notifications/expiry/${notifyId}/discard`,
  EXPIRY_NOTIFICATION_SNOOZE: (notifyId) => `/api/notifications/expiry/${notifyId}/snooze`,
  CREATE_SCRAP_REQUEST: () => '/api/scrap-maintenance/create',
  UPDATE_ASSET: (assetId) => `/api/assets/${assetId}`,
  /** Service vendors for org (auth). Optional query: ?serviceOnly=true */
  GET_VENDORS: () => '/api/get-vendors',
};

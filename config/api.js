// API Configuration
export const API_CONFIG = {
  // For development on mobile device, use your computer's IP address instead of localhost
  // BASE_URL: 'http://localhost:4000', // Use this for web development
  BASE_URL: 'http://192.168.0.106:4000', // Your computer's IP address
  ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiJPUkcwMDEiLCJ1c2VyX2lkIjoiVVNSMDAyIiwiZW1haWwiOiJuYXJlbnJpbzc1NkBnbWFpbC5jb20iLCJqb2Jfcm9sZV9pZCI6IkpSMDAxIiwiaWF0IjoxNzU0Mzc1NjkyLCJleHAiOjE3NTQ5ODA0OTJ9.5KfufndBAJbIWdR6zAsaySbwP9KWOys7HCTlN0ETB2w',
  TIMEOUT: 10000, // 10 seconds
};

// API Headers
export const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_CONFIG.ACCESS_TOKEN}`,
  'Accept': 'application/json',
});

// API Endpoints
export const API_ENDPOINTS = {
  CHECK_SERIAL: (serialNumber) => `/api/assets/serial/${serialNumber}`,
  GET_ASSET_ASSIGNMENT: (assetId) => `/api/asset-assignments/asset/${assetId}`,
  DELETE_ASSET_ASSIGNMENT: (assignmentId) => `/api/asset-assignments/${assignmentId}`,
  UPDATE_ASSET_ASSIGNMENT: (assignmentId) => `/api/asset-assignments/${assignmentId}`,
  GET_ASSET_ASSIGNMENT_HISTORY: (assetId) => `/api/asset-assignments/history/${assetId}`,
  GET_LATEST_ASSET_ASSIGNMENT: (assetId) => `/api/asset-assignments/latest/${assetId}`,
  GET_DEPARTMENTS: () => `/api/departments`,
  GET_EMPLOYEES_BY_DEPARTMENT: (deptId) => `/api/employees/department/${deptId}`,
  GET_EMPLOYEE: (employeeId) => `/api/employees/${employeeId}`,
  CREATE_ASSET_ASSIGNMENT: () => `/api/asset-assignments`,
  GET_EMPLOYEE_ACTIVE_ASSETS: (employeeId) => `/api/asset-assignments/employee/${employeeId}/active`,
  GET_EMPLOYEE_ASSET_HISTORY: (employeeId) => `/api/asset-assignments/employee-history/${employeeId}`,
  GET_ASSET_DETAILS: (assetId) => `/api/assets/${assetId}`,
}; 
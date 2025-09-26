// Mock navigation data for testing when backend is not available
export const mockNavigationData = {
  user_id: "USR002",
  data: [
    {
      app_id: "ASSETASSIGNMENT",
      label: "Asset Assignment",
      sequence: 1,
      access_level: "A",
      int_status: 1,
      icon: "barcode-scan"
    },
    {
      app_id: "EMPASSIGNMENT",
      label: "Employee Assignment",
      sequence: 2,
      access_level: "A",
      int_status: 1,
      icon: "account-group"
    },
    {
      app_id: "DEPTASSIGNMENT",
      label: "Department Assignment",
      sequence: 3,
      access_level: "A",
      int_status: 1,
      icon: "domain"
    },
    {
      app_id: "MAINTENANCE SUPERVISER",
      label: "Maintenance Supervisor",
      sequence: 4,
      access_level: "A",
      int_status: 1,
      icon: "wrench"
    },
    {
      app_id: "REPORTBREAKDOWN",
      label: "Report Breakdown",
      sequence: 5,
      access_level: "A",
      int_status: 1,
      icon: "clipboard-alert"
    }
  ]
};

// Function to get mock navigation data
export const getMockNavigationData = () => {
  return mockNavigationData;
};

// Function to check if mock data should be used
export const shouldUseMockData = () => {
  // Use mock data when API fails or for testing
  // This ensures the app works even when backend is not available
  return true; // Set to true to use mock data for now
};

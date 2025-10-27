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
    },
    {
      app_id: "WORKORDERMANAGEMENT",
      label: "Work Order Management",
      sequence: 6,
      access_level: "A",
      int_status: 1,
      icon: "clipboard-list"
    },
    {
      app_id: "FCMDEBUG",
      label: "FCM Debug",
      sequence: 7,
      access_level: "A",
      int_status: 1,
      icon: "bug"
    },
    {
      app_id: "FCMTEST",
      label: "FCM Test",
      sequence: 8,
      access_level: "A",
      int_status: 1,
      icon: "bell-ring"
    },
        {
          app_id: "NOTIFICATIONSETTINGS",
          label: "Notification Settings",
          sequence: 9,
          access_level: "A",
          int_status: 1,
          icon: "cog"
        },
        {
          app_id: "STATUSBARTESTER",
          label: "Status Bar Tester",
          sequence: 10,
          access_level: "A",
          int_status: 1,
          icon: "bell-outline"
        },
        {
          app_id: "NOTIFICATIONTROUBLESHOOTER",
          label: "Notification Troubleshooter",
          sequence: 11,
          access_level: "A",
          int_status: 1,
          icon: "wrench"
        }
  ]
};

// Function to get mock navigation data
export const getMockNavigationData = () => {
  return mockNavigationData;
};

// Function to check if mock data should be used
export const shouldUseMockData = () => {
  // Use mock data only when API fails or for testing
  // This ensures the app works even when backend is not available
  return true; // Set to true to use mock data for FCM testing
};

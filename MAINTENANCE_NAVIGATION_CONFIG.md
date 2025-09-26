# Maintenance Supervisor Navigation Configuration

## Overview

The Maintenance Supervisor screen has been configured with the following navigation settings:

## Configuration Details

### App ID
- **App ID:** `MAINTENANCE SUPERVISER`
- **Label:** `Maintenance Supervisor`
- **Icon:** `wrench`
- **Screen:** `MaintenanceSupervisor`

## Navigation Service Configuration

The following mappings have been added to `services/navigationService.js`:

```javascript
// Screen mapping
'MAINTENANCE SUPERVISER': 'MaintenanceSupervisor'

// Label mapping  
'MAINTENANCE SUPERVISER': 'Maintenance Supervisor'

// Icon mapping
'MAINTENANCE SUPERVISER': 'wrench'
```

## Mock Data Configuration

The mock navigation data in `utils/mockNavigationData.js` includes:

```javascript
{
  app_id: "MAINTENANCE SUPERVISER",
  label: "Maintenance Supervisor",
  sequence: 4,
  access_level: "A",
  int_status: 1,
  icon: "wrench"
}
```

## How It Works

1. **Backend Integration:** When the app fetches navigation data from the backend API, it will look for an item with `app_id: "MAINTENANCE SUPERVISER"`

2. **Screen Navigation:** When the user taps on the Maintenance Supervisor item, it will navigate to the `MaintenanceSupervisor` screen

3. **Fallback:** If the backend is not available, the app will use mock data that includes the Maintenance Supervisor configuration

4. **Access Control:** The Maintenance Supervisor requires admin access level (`A`)

## Testing the Configuration

To test that the configuration is working:

1. **Start the app** and log in
2. **Check the home screen** - you should see "Maintenance Supervisor" as one of the menu items
3. **Tap on "Maintenance Supervisor"** - it should navigate to the maintenance supervisor screen
4. **Verify the navigation** - you should be able to access the maintenance form

## Backend Requirements

For the backend to support this configuration, ensure that:

1. **Navigation API** returns an item with:
   - `app_id: "MAINTENANCE SUPERVISER"`
   - `label: "Maintenance Supervisor"`
   - `access_level: "A"` (for admin access)
   - `int_status: 1` (active)

2. **User permissions** allow access to the Maintenance Supervisor module

3. **Platform parameter** is set to `M` (mobile) when fetching navigation

## Troubleshooting

### If Maintenance Supervisor doesn't appear:

1. **Check backend response** - ensure the navigation API returns the correct app_id
2. **Verify user permissions** - ensure the user has admin access
3. **Check mock data** - if using mock data, ensure it's enabled
4. **Clear app cache** - restart the app to refresh navigation data

### If navigation doesn't work:

1. **Check screen mapping** - ensure `MaintenanceSupervisor` screen exists in App.js
2. **Verify imports** - ensure all maintenance screens are properly imported
3. **Check navigation service** - ensure the mapping is correct

## Files Modified

- `services/navigationService.js` - Added navigation mappings
- `utils/mockNavigationData.js` - Added mock data for testing
- `App.js` - Added maintenance screen routes
- `screens/HomeScreen.js` - Added maintenance dashboard to default menu

## Summary

✅ **App ID:** `MAINTENANCE SUPERVISER`  
✅ **Label:** `Maintenance Supervisor`  
✅ **Icon:** `wrench`  
✅ **Screen:** `MaintenanceSupervisor`  
✅ **Access Level:** `A` (Admin)  
✅ **Status:** Active  

The Maintenance Supervisor is now fully configured and ready to use! 🚀

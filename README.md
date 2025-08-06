# Asset Management App - Barcode Scanner

This React Native app includes a barcode scanning feature that integrates with your asset management system.

## Features

### Barcode Scanning (`asset_1.js`)
- Scan barcodes using the device camera
- Supports multiple barcode formats: QR, EAN13, EAN8, Code39, Code128, UPC-A, UPC-E
- Real-time barcode detection
- Loading indicators during API calls
- Error handling for network issues

### Asset Details Display (`asset_2.js`)
- Displays asset assignment information
- Shows department, employee, status, and dates
- Formatted date display
- Navigation back to scanner

## API Integration

The app makes the following API calls:

1. **Check Serial Number**: `GET http://localhost:4000/api/assets/serial/{serialNumber}`
   - Checks if the scanned barcode matches a serial number in `tblAssets`
   - Returns the `asset_id` if found

2. **Get Asset Assignment**: `GET http://localhost:4000/api/asset-assignments/asset/{assetId}`
   - Retrieves assignment details from `tblAssetAssignments`
   - Returns assignment data including employee, department, dates, etc.

## Workflow

1. User opens the Asset tab
2. Taps "Scan Asset" button
3. Camera opens for barcode scanning
4. After successful scan:
   - App calls API to check serial number
   - If found, gets asset assignment data
   - Navigates to details screen with data
5. Details screen shows all assignment information

## Error Handling

- **Asset Not Found**: Shows alert if serial number doesn't exist
- **No Assignment**: Shows alert if asset exists but isn't assigned
- **Network Errors**: Shows generic error message for API failures
- **Loading States**: Displays loading indicator during API calls

## Navigation

- `asset_1.js` → `asset_2.js` (AssetDetails)
- Back button in `asset_2.js` returns to scanner

## Dependencies

All required dependencies are already installed:
- `expo-camera` for camera functionality
- `@react-navigation/native` and `@react-navigation/stack` for navigation
- `react-native-paper` for UI components

## Testing

To test the functionality:

1. Start your backend server on `localhost:4000`
2. Run the React Native app
3. Navigate to the Asset tab
4. Scan a barcode that matches a serial number in your `tblAssets` table
5. Verify the asset assignment data is displayed correctly

## Notes

- The app expects the backend APIs to be running on `localhost:4000`
- Department and employee names are mapped from IDs in the code
- Date formatting uses DD/MM/YYYY format
- All API calls include proper error handling and user feedback

## Network & Authorization Setup

### 1. Network Configuration
For mobile development, you need to use your computer's IP address instead of `localhost`:

1. **Find your computer's IP address**:
   - On Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - On Windows: `ipconfig`

2. **Update the BASE_URL** in `config/api.js`:
   ```javascript
   BASE_URL: 'http://YOUR_COMPUTER_IP:4000',
   ```

### 2. Authorization Setup
1. **Update API Token**: Edit `config/api.js` and replace `YOUR_ACCESS_TOKEN_HERE` with your actual authorization token:
   ```javascript
   ACCESS_TOKEN: 'your_actual_token_here',
   ```

2. **Token Format**: The app uses Bearer token authentication:
   ```
   Authorization: Bearer your_token_here
   ```

### 3. Backend Server Setup
Make sure your backend server is:
- Running on port 4000
- Accessible from your mobile device (same network)
- Configured to accept requests from your mobile app

### 4. Testing
After updating the IP and token, test the barcode scanning functionality to ensure proper network connectivity and authentication. 
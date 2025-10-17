const { getServerUrl, getApiHeaders, API_ENDPOINTS } = require('../config/api');

async function testAssetTypesAPI() {
  console.log('=== Testing Asset Types API ===');
  
  try {
    const serverUrl = getServerUrl();
    const headers = await getApiHeaders();
    const fullUrl = `${serverUrl}${API_ENDPOINTS.GET_ASSET_TYPES_MAINT_REQUIRED()}`;
    
    console.log('Server URL:', serverUrl);
    console.log('Full URL:', fullUrl);
    console.log('Headers:', headers);
    
    // Test health endpoint first
    console.log('\n--- Testing Health Endpoint ---');
    try {
      const healthResponse = await fetch(`${serverUrl}/api/health`);
      console.log('Health check status:', healthResponse.status);
      const healthData = await healthResponse.text();
      console.log('Health response:', healthData);
    } catch (healthError) {
      console.error('Health check failed:', healthError.message);
    }
    
    // Test asset types endpoint
    console.log('\n--- Testing Asset Types Endpoint ---');
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Error type:', error.constructor.name);
  }
}

// Run the test
testAssetTypesAPI();

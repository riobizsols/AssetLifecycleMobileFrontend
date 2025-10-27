/**
 * Utility functions for handling API responses and preventing JSON parse errors
 */

/**
 * Safely parse JSON response, handling non-JSON responses gracefully
 * @param {Response} response - The fetch response object
 * @returns {Promise<Object|string>} - Parsed JSON object or error message
 */
export const safeJsonParse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // If not JSON, get text response for debugging
      const textResponse = await response.text();
      console.error('Non-JSON response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: contentType,
        response: textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : '')
      });
      
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      // This is the specific JSON parse error we're trying to prevent
      const textResponse = await response.text().catch(() => 'Unable to read response');
      console.error('JSON Parse Error - Response was not valid JSON:', textResponse.substring(0, 200));
      throw new Error(`Invalid JSON response from server: ${response.status} ${response.statusText}`);
    }
    throw error;
  }
};

/**
 * Handle API response with proper error handling
 * @param {Response} response - The fetch response object
 * @returns {Promise<Object>} - Parsed response data
 */
export const handleApiResponse = async (response) => {
  try {
    const data = await safeJsonParse(response);
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data 
      };
    }
  } catch (error) {
    console.error('API Response Error:', error);
    return {
      success: false,
      error: error.message,
      status: response.status || 0
    };
  }
};

/**
 * Enhanced fetch wrapper with better error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data with success/error info
 */
export const safeFetch = async (url, options = {}) => {
  try {
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Fetch Error:', error);
    return {
      success: false,
      error: error.message,
      isNetworkError: error.message.includes('Network request failed'),
      isTimeoutError: error.message.includes('timeout')
    };
  }
};

/**
 * Test server connectivity
 * @param {string} baseUrl - Base URL to test
 * @returns {Promise<boolean>} - Whether server is reachable
 */
export const testServerConnection = async (baseUrl) => {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000
    });
    
    return response.ok;
  } catch (error) {
    console.log(`Server ${baseUrl} not reachable:`, error.message);
    return false;
  }
};

/**
 * Get user-friendly error message
 * @param {Object} errorResult - Error result from API call
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (errorResult) => {
  if (errorResult.isNetworkError) {
    return 'Network connection failed. Please check your internet connection.';
  }
  
  if (errorResult.isTimeoutError) {
    return 'Request timed out. Please try again.';
  }
  
  if (errorResult.status === 401) {
    return 'Authentication failed. Please check your credentials.';
  }
  
  if (errorResult.status === 404) {
    return 'Server endpoint not found. Please contact support.';
  }
  
  if (errorResult.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return errorResult.error || 'An unexpected error occurred.';
};

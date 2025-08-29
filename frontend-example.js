// Frontend JavaScript Example for Authentication API
// This shows how to handle Bearer tokens and expired token scenarios in a web application

class AuthAPI {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Helper method to make API requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Bearer token if available
    if (this.accessToken && !options.skipAuth) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle expired access token
      if (response.status === 401 && data.code === 'AUTHENTICATION_ERROR') {
        console.log('🔄 Access token expired, attempting refresh...');
        
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, config);
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Register a new user
  async register(email, password) {
    try {
      console.log('📝 Registering user:', email);
      
      const response = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        this.setTokens(response.data.tokens);
        console.log('✅ Registration successful!');
        return response.data.user;
      }
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      console.log('🔑 Logging in user:', email);
      
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        this.setTokens(response.data.tokens);
        console.log('✅ Login successful!');
        return response.data.user;
      }
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  // Get user profile (protected route)
  async getProfile() {
    try {
      console.log('👤 Fetching user profile...');
      
      const response = await this.makeRequest('/api/auth/profile', {
        method: 'GET',
      });

      if (response.success) {
        console.log('✅ Profile retrieved successfully!');
        return response.data.user;
      }
    } catch (error) {
      console.error('❌ Failed to get profile:', error.message);
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.log('❌ No refresh token available');
      return false;
    }

    try {
      console.log('🔄 Refreshing access token...');
      
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.setTokens(data.data.tokens);
        console.log('✅ Tokens refreshed successfully!');
        return true;
      } else {
        console.log('❌ Token refresh failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.accessToken) {
        console.log('🚪 Logging out...');
        
        await this.makeRequest('/api/auth/logout', {
          method: 'POST',
        });
      }

      this.clearTokens();
      console.log('✅ Logout successful!');
    } catch (error) {
      console.error('❌ Logout failed:', error.message);
      // Clear tokens anyway
      this.clearTokens();
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      console.log('🔐 Changing password...');
      
      const response = await this.makeRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.success) {
        console.log('✅ Password changed successfully!');
        // Clear tokens as they are invalidated
        this.clearTokens();
        return true;
      }
    } catch (error) {
      console.error('❌ Password change failed:', error.message);
      throw error;
    }
  }

  // Store tokens in localStorage
  setTokens(tokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    
    localStorage.setItem('accessToken', this.accessToken);
    localStorage.setItem('refreshToken', this.refreshToken);
    
    console.log('💾 Tokens stored in localStorage');
  }

  // Clear tokens from localStorage
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    console.log('🗑️ Tokens cleared from localStorage');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Get current access token
  getAccessToken() {
    return this.accessToken;
  }
}

// Example usage and demonstration
async function demonstrateAuthFlow() {
  console.log('🚀 Starting Authentication Flow Demonstration\n');
  
  const auth = new AuthAPI();

  try {
    // 1. Register a new user
    console.log('=== Step 1: User Registration ===');
    const user = await auth.register('demo@example.com', 'demopassword123');
    console.log('User:', user);
    console.log('Access Token:', auth.getAccessToken().substring(0, 50) + '...\n');

    // 2. Get user profile
    console.log('=== Step 2: Get User Profile (Protected Route) ===');
    const profile = await auth.getProfile();
    console.log('Profile:', profile);
    console.log();

    // 3. Simulate token expiration by using invalid token
    console.log('=== Step 3: Simulate Expired Token ===');
    // Store current valid token
    const validToken = auth.accessToken;
    
    // Set an invalid token
    auth.accessToken = 'invalid.token.here';
    localStorage.setItem('accessToken', auth.accessToken);
    
    console.log('Set invalid token, attempting to get profile...');
    try {
      await auth.getProfile(); // This should trigger token refresh
    } catch (error) {
      console.log('Error handled:', error.message);
    }
    console.log();

    // 4. Test refresh token functionality
    console.log('=== Step 4: Manual Token Refresh ===');
    // Restore valid token but test refresh
    auth.accessToken = validToken;
    const refreshed = await auth.refreshAccessToken();
    console.log('Token refresh result:', refreshed);
    console.log();

    // 5. Test logout
    console.log('=== Step 5: Logout ===');
    await auth.logout();
    console.log('Is authenticated:', auth.isAuthenticated());
    console.log();

    // 6. Try to access protected route after logout
    console.log('=== Step 6: Access Protected Route After Logout ===');
    try {
      await auth.getProfile();
    } catch (error) {
      console.log('Expected error:', error.message);
    }

  } catch (error) {
    console.error('Demo error:', error.message);
  }
}

// Example of how to use in a real application
class App {
  constructor() {
    this.auth = new AuthAPI();
    this.init();
  }

  init() {
    // Check if user is already logged in
    if (this.auth.isAuthenticated()) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  async handleLogin(email, password) {
    try {
      const user = await this.auth.login(email, password);
      this.showDashboard();
    } catch (error) {
      this.showError('Login failed: ' + error.message);
    }
  }

  async handleLogout() {
    await this.auth.logout();
    this.showLogin();
  }

  async makeAuthenticatedRequest() {
    try {
      // This will automatically handle token refresh if needed
      const profile = await this.auth.getProfile();
      return profile;
    } catch (error) {
      if (error.message.includes('Session expired')) {
        // Redirect to login
        this.showLogin();
      } else {
        this.showError(error.message);
      }
    }
  }

  showLogin() {
    console.log('🔐 Showing login form');
  }

  showDashboard() {
    console.log('📊 Showing dashboard');
  }

  showError(message) {
    console.log('❌ Error:', message);
  }
}

// Browser usage example
if (typeof window !== 'undefined') {
  // In browser environment
  window.AuthAPI = AuthAPI;
  window.demonstrateAuthFlow = demonstrateAuthFlow;
  
  console.log('🌐 AuthAPI loaded! Try running:');
  console.log('demonstrateAuthFlow() - to see the full demo');
  console.log('new AuthAPI() - to create an auth instance');
} else {
  // In Node.js environment (for testing)
  module.exports = { AuthAPI, demonstrateAuthFlow };
}

/* 
Usage Examples:

1. Register and login:
   const auth = new AuthAPI();
   await auth.register('user@example.com', 'password123');
   await auth.login('user@example.com', 'password123');

2. Make authenticated requests:
   const profile = await auth.getProfile();

3. Handle token refresh automatically:
   // The API class automatically handles token refresh when needed

4. Manual logout:
   await auth.logout();

5. Check authentication status:
   if (auth.isAuthenticated()) {
     // User is logged in
   }
*/ 
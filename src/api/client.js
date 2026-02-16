// API Client for CloudDrive Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.baseURL = API_URL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Set authentication tokens
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Clear authentication tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get current access token
  getAccessToken() {
    return this.accessToken || localStorage.getItem('accessToken');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...options.headers,
    };

    // Add authorization header if we have a token
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON requests (unless it's FormData)
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, clear tokens and throw
          this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Handle API response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    if (isJson) {
      return response.json();
    }

    return response;
  }

  // Try to refresh the access token
  async tryRefreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async logout() {
    this.clearTokens();
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // File endpoints
  async uploadFile(file, folderId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    return this.request('/files/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getFiles(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/files${query ? `?${query}` : ''}`);
  }

  async getFile(id) {
    return this.request(`/files/${id}`);
  }

  async downloadFile(id) {
    return this.request(`/files/${id}/download`);
  }

  async updateFile(id, data) {
    return this.request(`/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async trashFile(id) {
    return this.request(`/files/${id}/trash`, {
      method: 'POST',
    });
  }

  async restoreFile(id) {
    return this.request(`/files/${id}/restore`, {
      method: 'POST',
    });
  }

  async deleteFile(id) {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    });
  }

  // Folder endpoints
  async createFolder(name, parentId = null, color = null) {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId, color }),
    });
  }

  async getFolders(parentId = null) {
    const query = parentId !== null ? `?parentId=${parentId}` : '';
    return this.request(`/folders${query}`);
  }

  async updateFolder(id, data) {
    return this.request(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFolder(id) {
    return this.request(`/folders/${id}`, {
      method: 'DELETE',
    });
  }

  // Cloud import endpoints
  async getGoogleAuthUrl() {
    return this.request('/import/google/auth');
  }

  async importFromGoogleDrive(fileIds) {
    return this.request('/import/google/import', {
      method: 'POST',
      body: JSON.stringify({ fileIds }),
    });
  }

  async getMicrosoftAuthUrl() {
    return this.request('/import/microsoft/auth');
  }

  async getDropboxAuthUrl() {
    return this.request('/import/dropbox/auth');
  }
}

// Create singleton instance
const api = new APIClient();

export default api;

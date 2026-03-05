import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API_URL from '../config/api.js'

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// 1. Verify Session on Page Reload
export const verifyUser = createAsyncThunk(
  'auth/verifyUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/user/me`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue('Not authenticated');
      return data;
    } catch (err) {
      return rejectWithValue('Network error');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data?.error || 'Login failed');
      // Store token in localStorage
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      return rejectWithValue('Network error');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data?.error || 'Signup failed');
      // Store token in localStorage
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      return rejectWithValue('Network error');
    }
  }
);

// 2. Logout — clear token from localStorage
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await fetch(`${API_URL}/api/user/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      localStorage.removeItem('token');
      return null;
    } catch (err) {
      // Still clear token even if network fails
      localStorage.removeItem('token');
      return rejectWithValue('Network error');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthReady: false // Wait for initial session check
  },
  reducers: {
    // Allow manually setting user (e.g. after impersonation)
    setUser: (state, action) => {
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Verify User
      .addCase(verifyUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthReady = true;
      })
      .addCase(verifyUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthReady = true; // Still ready, just not logged in
        localStorage.removeItem('token'); // Clean up invalid token
      })
      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      // Signup
      .addCase(signupUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Signup failed';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  }
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
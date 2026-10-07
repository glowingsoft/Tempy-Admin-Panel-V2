import { createSlice } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storageSession from 'redux-persist/lib/storage/session';

// ----------------------------------------------------------------------

const initialState = {
  isActive: false,
  adminUser: null,
  adminToken: null,
  targetType: null,
  targetId: null,
  targetName: null,
};

const impersonationSlice = createSlice({
  name: 'impersonation',
  initialState,
  reducers: {
    startImpersonation(state, action) {
      state.isActive = true;
      state.adminUser = action.payload.adminUser;
      state.adminToken = action.payload.adminToken;
      state.targetType = action.payload.targetType;
      state.targetId = action.payload.targetId;
      state.targetName = action.payload.targetName;
    },
    clearImpersonation() {
      return initialState;
    },
  },
});

export const { startImpersonation, clearImpersonation } = impersonationSlice.actions;

const persistConfig = {
  key: 'impersonation',
  storage: storageSession,
};

export default persistReducer(persistConfig, impersonationSlice.reducer);

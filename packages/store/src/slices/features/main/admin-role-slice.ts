import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ServicePermission {
  tileName: string;
  serviceName: string;
  screens: Screen[];
}

export interface Screen {
  screenName: string;
  components: Component[];
}

export interface Component {
  componentName: string;
  componentType: string;
  tasks: Task[];
}

export interface Task {
  taskName: string;
  taskType: string;
}

export interface AdminRole {
  screenPermissions: ServicePermission[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminRoleState {
  adminRole: AdminRole | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminRoleState = {
  adminRole: null,
  adminUser: null,
  loading: false,
  error: null,
};

const adminRoleSlice = createSlice({
  name: 'adminRole',
  initialState,
  reducers: {
    setAdminRole: (state, action: PayloadAction<AdminRole>) => {
      state.adminRole = action.payload;
    },
    setAdminUser: (state, action: PayloadAction<AdminUser>) => {
      state.adminUser = action.payload;
    },
    clearAdminRole: (state) => {
      state.adminRole = null;
      state.adminUser = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAdminRole,
  setAdminUser,
  clearAdminRole,
  setLoading,
  setError,
} = adminRoleSlice.actions;

// Selectors
export const selectAdminRole = (state: any) => state.adminRole?.adminRole;
export const selectAdminUser = (state: any) => state.adminRole?.adminUser;
export const selectAdminRoleLoading = (state: any) => state.adminRole?.loading;
export const selectAdminRoleError = (state: any) => state.adminRole?.error;
export const selectServicePermissions = (state: any) => state.adminRole?.adminRole?.screenPermissions || [];
export const selectMusterService = (state: any) => 
  state.adminRole?.adminRole?.screenPermissions?.find((s: any) => s.serviceName === 'master') || null;

export default adminRoleSlice.reducer;
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { 
    selectAdminRole, 
    selectAdminUser, 
    selectAdminRoleLoading, 
    selectAdminRoleError,
    selectServicePermissions,
    selectMusterService,
    setAdminRole,
    setAdminUser,
    clearAdminRole,
    setLoading,
    setError
} from '../slices/features/main/admin-role-slice';
import { RootState } from '../store';

export const useAdminRole = () => {
    const dispatch = useDispatch();
    
    // Selectors
    const adminRole = useSelector((state: RootState) => selectAdminRole(state));
    const adminUser = useSelector((state: RootState) => selectAdminUser(state));
    const loading = useSelector((state: RootState) => selectAdminRoleLoading(state));
    const error = useSelector((state: RootState) => selectAdminRoleError(state));
    const servicePermissions = useSelector((state: RootState) => selectServicePermissions(state), shallowEqual);
    const musterService = useSelector((state: RootState) => selectMusterService(state), shallowEqual);
    
    // Actions
    const setAdminRoleData = (role: any) => dispatch(setAdminRole(role));
    const setAdminUserData = (user: any) => dispatch(setAdminUser(user));
    const setAdminRoleAndUser = (role: any, user: any) => {
        dispatch(setAdminRole(role));
        dispatch(setAdminUser(user));
    };
    const clearAdminRoleData = () => dispatch(clearAdminRole());
    const setLoadingState = (isLoading: boolean) => dispatch(setLoading(isLoading));
    const setErrorState = (errorMessage: string) => dispatch(setError(errorMessage));
    
    // Helper functions
    const getMusterService = () => musterService;
    const hasPermission = (serviceName: string, screenName?: string, componentName?: string) => {
        if (!adminRole) return false;
        
        const service = adminRole.screenPermissions.find((s: any) => s.serviceName === serviceName);
        if (!service) return false;
        
        if (screenName) {
            const screen = service.screens.find((s: any) => s.screenName === screenName);
            if (!screen) return false;
            
            if (componentName) {
                return screen.components?.some((c: any) => c.componentName === componentName) || false;
            }
            return true;
        }
        
        return true;
    };
    
    return {
        // State
        adminRole,
        adminUser,
        loading,
        error,
        servicePermissions,
        musterService,
        
        // Actions
        setAdminRoleData,
        setAdminUserData,
        setAdminRoleAndUser,
        clearAdminRoleData,
        setLoadingState,
        setErrorState,
        
        // Helper functions
        getMusterService,
        hasPermission,
    };
};

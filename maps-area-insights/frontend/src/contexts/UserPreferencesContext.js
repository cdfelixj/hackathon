import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';

// Initial state
const initialState = {
  userId: null,
  preferences: {
    interests: ['restaurant', 'tourist_attraction', 'shopping_mall'],
    ageGroup: 'adult',
    activityTypes: ['sightseeing', 'dining', 'shopping'],
    preferredEnvironment: 'mixed',
    priceRange: 'medium',
    timePreference: 'flexible',
    groupSize: 'small',
    accessibilityNeeds: false,
  },
  availableOptions: {
    interests: [],
    ageGroups: [],
    environments: [],
    priceRanges: [],
    timePreferences: [],
    activityTypes: [],
  },
  isLoading: false,
  hasChanges: false,
  lastSaved: null,
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER_ID: 'SET_USER_ID',
  SET_PREFERENCES: 'SET_PREFERENCES',
  UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',
  SET_AVAILABLE_OPTIONS: 'SET_AVAILABLE_OPTIONS',
  SET_HAS_CHANGES: 'SET_HAS_CHANGES',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
};

// Reducer function
function preferencesReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case actionTypes.SET_USER_ID:
      return {
        ...state,
        userId: action.payload,
      };

    case actionTypes.SET_PREFERENCES:
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
        hasChanges: false,
        error: null,
      };

    case actionTypes.UPDATE_PREFERENCE:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.key]: action.value,
        },
        hasChanges: true,
        error: null,
      };

    case actionTypes.SET_AVAILABLE_OPTIONS:
      return {
        ...state,
        availableOptions: { ...state.availableOptions, ...action.payload },
      };

    case actionTypes.SET_HAS_CHANGES:
      return {
        ...state,
        hasChanges: action.payload,
      };

    case actionTypes.SET_LAST_SAVED:
      return {
        ...state,
        lastSaved: action.payload,
        hasChanges: false,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case actionTypes.RESET_STATE:
      return {
        ...initialState,
        userId: state.userId, // Keep user ID
      };

    default:
      return state;
  }
}

// Create context
const UserPreferencesContext = createContext();

// Provider component
export function UserPreferencesProvider({ children }) {
  const [state, dispatch] = useReducer(preferencesReducer, initialState);

  // Initialize user ID if not exists
  const initializeUserId = useCallback(() => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem('userId', userId);
    }
    dispatch({ type: actionTypes.SET_USER_ID, payload: userId });
    return userId;
  }, []);

  // Load preferences from backend or localStorage
  const loadPreferences = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      const userId = initializeUserId();
      
      // Try to load from backend first
      try {
        const response = await apiService.getUserPreferences(userId);
        
        if (response.success && response.data) {
          dispatch({ 
            type: actionTypes.SET_PREFERENCES, 
            payload: response.data.preferences 
          });
          
          if (response.data.availableOptions) {
            dispatch({ 
              type: actionTypes.SET_AVAILABLE_OPTIONS, 
              payload: response.data.availableOptions 
            });
          }

          // Cache preferences locally
          localStorage.setItem('userPreferences', JSON.stringify(response.data.preferences));
        }
      } catch (apiError) {
        console.warn('Failed to load preferences from backend, using local storage:', apiError);
        
        // Fallback to localStorage
        const localPreferences = localStorage.getItem('userPreferences');
        if (localPreferences) {
          try {
            const parsed = JSON.parse(localPreferences);
            dispatch({ type: actionTypes.SET_PREFERENCES, payload: parsed });
          } catch (parseError) {
            console.error('Failed to parse local preferences:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [initializeUserId]);

  // Save preferences to backend
  const savePreferences = useCallback(async (preferences = state.preferences) => {
    if (!state.userId) {
      console.error('No user ID available for saving preferences');
      return false;
    }

    dispatch({ type: actionTypes.SET_LOADING, payload: true });

    try {
      const response = await apiService.saveUserPreferences(preferences, state.userId);
      
      if (response.success) {
        dispatch({ type: actionTypes.SET_LAST_SAVED, payload: new Date() });
        
        // Update local cache
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        
        toast.success('Preferences saved successfully!');
        return true;
      } else {
        throw new Error(response.message || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      
      // Save locally as fallback
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      toast.error('Failed to sync with server, saved locally');
      
      return false;
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [state.userId, state.preferences]);

  // Update a single preference
  const updatePreference = useCallback((key, value) => {
    dispatch({ 
      type: actionTypes.UPDATE_PREFERENCE, 
      key, 
      value 
    });
  }, []);

  // Update multiple preferences at once
  const updatePreferences = useCallback((updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      dispatch({ 
        type: actionTypes.UPDATE_PREFERENCE, 
        key, 
        value 
      });
    });
  }, []);

  // Reset preferences to default
  const resetPreferences = useCallback(() => {
    dispatch({ type: actionTypes.RESET_STATE });
    localStorage.removeItem('userPreferences');
    toast.success('Preferences reset to default');
  }, []);

  // Auto-save preferences when they change (with debounce)
  useEffect(() => {
    if (!state.hasChanges) return;

    const saveTimeout = setTimeout(() => {
      savePreferences();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimeout);
  }, [state.hasChanges, state.preferences, savePreferences]);

  // Get preference suggestions based on current selections
  const getPreferenceSuggestions = useCallback(() => {
    const suggestions = [];
    
    // Suggest based on interests
    if (state.preferences.interests.includes('food') && !state.preferences.interests.includes('nightlife')) {
      suggestions.push({
        type: 'interest',
        suggestion: 'nightlife',
        reason: 'Food enthusiasts often enjoy nightlife experiences',
      });
    }
    
    if (state.preferences.interests.includes('culture') && !state.preferences.interests.includes('history')) {
      suggestions.push({
        type: 'interest',
        suggestion: 'history',
        reason: 'Culture lovers typically appreciate historical sites',
      });
    }

    // Suggest based on age group
    if (state.preferences.ageGroup === 'young' && state.preferences.preferredEnvironment === 'quiet') {
      suggestions.push({
        type: 'environment',
        suggestion: 'busy',
        reason: 'Young explorers often enjoy lively atmospheres',
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }, [state.preferences]);

  // Get compatibility score with another user's preferences
  const getCompatibilityScore = useCallback((otherPreferences) => {
    const currentInterests = new Set(state.preferences.interests);
    const otherInterests = new Set(otherPreferences.interests);
    
    const intersection = new Set([...currentInterests].filter(x => otherInterests.has(x)));
    const union = new Set([...currentInterests, ...otherInterests]);
    
    const interestScore = intersection.size / union.size;
    
    // Additional factors
    const ageGroupMatch = state.preferences.ageGroup === otherPreferences.ageGroup ? 0.2 : 0;
    const environmentMatch = state.preferences.preferredEnvironment === otherPreferences.preferredEnvironment ? 0.1 : 0;
    const priceMatch = state.preferences.priceRange === otherPreferences.priceRange ? 0.1 : 0;
    
    const totalScore = (interestScore * 0.6) + ageGroupMatch + environmentMatch + priceMatch;
    
    return Math.round(totalScore * 100);
  }, [state.preferences]);

  // Check if preferences are complete
  const isPreferencesComplete = useCallback(() => {
    const required = ['interests', 'ageGroup', 'preferredEnvironment'];
    return required.every(key => 
      state.preferences[key] && 
      (Array.isArray(state.preferences[key]) ? state.preferences[key].length > 0 : true)
    );
  }, [state.preferences]);

  // Export preferences for backup
  const exportPreferences = useCallback(() => {
    const exportData = {
      preferences: state.preferences,
      userId: state.userId,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preferences-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Preferences exported successfully!');
  }, [state.preferences, state.userId]);

  // Import preferences from file
  const importPreferences = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (importData.preferences && importData.version) {
            dispatch({ 
              type: actionTypes.SET_PREFERENCES, 
              payload: importData.preferences 
            });
            
            toast.success('Preferences imported successfully!');
            resolve(importData.preferences);
          } else {
            throw new Error('Invalid preferences file format');
          }
        } catch (error) {
          console.error('Error importing preferences:', error);
          toast.error('Failed to import preferences');
          reject(error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Failed to read file');
        toast.error('Failed to read preferences file');
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }, []);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    loadPreferences,
    savePreferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    
    // Utilities
    getPreferenceSuggestions,
    getCompatibilityScore,
    isPreferencesComplete: isPreferencesComplete(),
    exportPreferences,
    importPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

// Custom hook to use the context
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  
  return context;
}

export default UserPreferencesContext;

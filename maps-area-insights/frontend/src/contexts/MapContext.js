import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/apiService';
import { useUserPreferences } from './UserPreferencesContext';

// Initial state
const initialState = {
  map: null,
  isMapLoaded: false,
  currentLocation: {
    lat: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LAT) || 40.7128,
    lng: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LNG) || -74.0060,
  },
  selectedLocation: null,
  areaInsights: null,
  isLoadingInsights: false,
  markers: [],
  activeMarker: null,
  showInsights: false,
  searchHistory: [],
  mapCenter: {
    lat: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LAT) || 40.7128,
    lng: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LNG) || -74.0060,
  },
  mapZoom: parseInt(process.env.REACT_APP_DEFAULT_MAP_ZOOM) || 12,
  error: null,
};

// Action types
const actionTypes = {
  SET_MAP: 'SET_MAP',
  SET_MAP_LOADED: 'SET_MAP_LOADED',
  SET_CURRENT_LOCATION: 'SET_CURRENT_LOCATION',
  SET_SELECTED_LOCATION: 'SET_SELECTED_LOCATION',
  SET_AREA_INSIGHTS: 'SET_AREA_INSIGHTS',
  SET_LOADING_INSIGHTS: 'SET_LOADING_INSIGHTS',
  ADD_MARKER: 'ADD_MARKER',
  REMOVE_MARKER: 'REMOVE_MARKER',
  CLEAR_MARKERS: 'CLEAR_MARKERS',
  SET_ACTIVE_MARKER: 'SET_ACTIVE_MARKER',
  SET_SHOW_INSIGHTS: 'SET_SHOW_INSIGHTS',
  ADD_TO_SEARCH_HISTORY: 'ADD_TO_SEARCH_HISTORY',
  SET_MAP_CENTER: 'SET_MAP_CENTER',
  SET_MAP_ZOOM: 'SET_MAP_ZOOM',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
function mapReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_MAP:
      return {
        ...state,
        map: action.payload,
      };

    case actionTypes.SET_MAP_LOADED:
      return {
        ...state,
        isMapLoaded: action.payload,
      };

    case actionTypes.SET_CURRENT_LOCATION:
      return {
        ...state,
        currentLocation: action.payload,
      };

    case actionTypes.SET_SELECTED_LOCATION:
      return {
        ...state,
        selectedLocation: action.payload,
        error: null,
      };

    case actionTypes.SET_AREA_INSIGHTS:
      return {
        ...state,
        areaInsights: action.payload,
        isLoadingInsights: false,
        error: null,
      };

    case actionTypes.SET_LOADING_INSIGHTS:
      return {
        ...state,
        isLoadingInsights: action.payload,
      };

    case actionTypes.ADD_MARKER:
      return {
        ...state,
        markers: [...state.markers, action.payload],
      };

    case actionTypes.REMOVE_MARKER:
      return {
        ...state,
        markers: state.markers.filter(marker => marker.id !== action.payload),
      };

    case actionTypes.CLEAR_MARKERS:
      return {
        ...state,
        markers: [],
        activeMarker: null,
      };

    case actionTypes.SET_ACTIVE_MARKER:
      return {
        ...state,
        activeMarker: action.payload,
      };

    case actionTypes.SET_SHOW_INSIGHTS:
      return {
        ...state,
        showInsights: action.payload,
      };

    case actionTypes.ADD_TO_SEARCH_HISTORY:
      const newHistory = [action.payload, ...state.searchHistory.slice(0, 9)]; // Keep last 10
      return {
        ...state,
        searchHistory: newHistory,
      };

    case actionTypes.SET_MAP_CENTER:
      return {
        ...state,
        mapCenter: action.payload,
      };

    case actionTypes.SET_MAP_ZOOM:
      return {
        ...state,
        mapZoom: action.payload,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoadingInsights: false,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const MapContext = createContext();

// Provider component
export function MapProvider({ children }) {
  const [state, dispatch] = useReducer(mapReducer, initialState);
  const { userId, preferences } = useUserPreferences();
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  const initializeMap = useCallback((mapInstance) => {
    dispatch({ type: actionTypes.SET_MAP, payload: mapInstance });
    mapRef.current = mapInstance;
    
    // Set up click listener
    mapInstance.addListener('click', (event) => {
      const coords = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      handleMapClick(coords);
    });

    dispatch({ type: actionTypes.SET_MAP_LOADED, payload: true });
  }, []);

  // Handle map click
  const handleMapClick = useCallback(async (coords) => {
    try {
      dispatch({ type: actionTypes.SET_SELECTED_LOCATION, payload: coords });
      dispatch({ type: actionTypes.SET_LOADING_INSIGHTS, payload: true });
      dispatch({ type: actionTypes.CLEAR_ERROR });

      // Add marker at clicked location
      const markerId = Date.now().toString();
      addMarker({
        id: markerId,
        position: coords,
        type: 'search',
        title: 'Searching for insights...',
      });

      // Get area insights
      const insights = await apiService.getAreaInsights(coords, userId);
      
      if (insights.success) {
        dispatch({ type: actionTypes.SET_AREA_INSIGHTS, payload: insights.data });
        dispatch({ type: actionTypes.SET_SHOW_INSIGHTS, payload: true });
        
        // Update marker
        updateMarker(markerId, {
          title: 'Area Insights Available',
          type: 'insights',
        });

        // Add to search history
        dispatch({ 
          type: actionTypes.ADD_TO_SEARCH_HISTORY, 
          payload: {
            coords,
            timestamp: new Date(),
            resultsCount: insights.data.topRecommendations?.length || 0,
          }
        });

        toast.success('Area insights loaded!');
      } else {
        throw new Error(insights.message || 'Failed to get area insights');
      }
    } catch (error) {
      console.error('Error getting area insights:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      toast.error('Failed to get area insights');
      
      // Remove the search marker on error
      removeMarker(markerId);
    }
  }, [userId]);

  // Add marker to map
  const addMarker = useCallback((markerData) => {
    if (!state.map) return null;

    const marker = new window.google.maps.Marker({
      position: markerData.position,
      map: state.map,
      title: markerData.title,
      icon: getMarkerIcon(markerData.type),
    });

    const markerWithData = {
      ...markerData,
      marker,
    };

    markersRef.current.push(markerWithData);
    dispatch({ type: actionTypes.ADD_MARKER, payload: markerWithData });

    return markerWithData;
  }, [state.map]);

  // Remove marker from map
  const removeMarker = useCallback((markerId) => {
    const markerIndex = markersRef.current.findIndex(m => m.id === markerId);
    if (markerIndex !== -1) {
      const markerData = markersRef.current[markerIndex];
      markerData.marker.setMap(null);
      markersRef.current.splice(markerIndex, 1);
      dispatch({ type: actionTypes.REMOVE_MARKER, payload: markerId });
    }
  }, []);

  // Update marker
  const updateMarker = useCallback((markerId, updates) => {
    const markerData = markersRef.current.find(m => m.id === markerId);
    if (markerData) {
      if (updates.title) markerData.marker.setTitle(updates.title);
      if (updates.type) markerData.marker.setIcon(getMarkerIcon(updates.type));
      
      // Update in state
      const updatedMarkers = state.markers.map(m => 
        m.id === markerId ? { ...m, ...updates } : m
      );
      dispatch({ type: actionTypes.CLEAR_MARKERS });
      updatedMarkers.forEach(m => dispatch({ type: actionTypes.ADD_MARKER, payload: m }));
    }
  }, [state.markers]);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(markerData => {
      markerData.marker.setMap(null);
    });
    markersRef.current = [];
    dispatch({ type: actionTypes.CLEAR_MARKERS });
  }, []);

  // Get current user location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          dispatch({ type: actionTypes.SET_CURRENT_LOCATION, payload: coords });
          centerMapOnLocation(coords);
          resolve(coords);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  // Center map on location
  const centerMapOnLocation = useCallback((coords, zoom = state.mapZoom) => {
    if (state.map) {
      state.map.setCenter(coords);
      state.map.setZoom(zoom);
      dispatch({ type: actionTypes.SET_MAP_CENTER, payload: coords });
      dispatch({ type: actionTypes.SET_MAP_ZOOM, payload: zoom });
    }
  }, [state.map, state.mapZoom]);

  // Search for a specific address
  const searchAddress = useCallback((address) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const coords = {
            lat: location.lat(),
            lng: location.lng(),
          };
          
          centerMapOnLocation(coords, 15);
          handleMapClick(coords);
          resolve(coords);
        } else {
          reject(new Error('Address not found'));
        }
      });
    });
  }, [centerMapOnLocation, handleMapClick]);

  // Get marker icon based on type
  const getMarkerIcon = useCallback((type) => {
    const iconMap = {
      search: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#667eea" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12),
      },
      insights: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
            <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16),
      },
      restaurant: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#f59e0b" stroke="white" stroke-width="2"/>
            <path d="M12 2v10m0 0l4-4m-4 4L8 8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12),
      },
      attraction: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#ef4444" stroke="white" stroke-width="2"/>
            <star cx="12" cy="12" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12),
      },
    };

    return iconMap[type] || iconMap.search;
  }, []);

  // Add markers for places
  const addPlaceMarkers = useCallback((places, type = 'restaurant') => {
    places.forEach((place, index) => {
      if (place.geometry?.location) {
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        
        addMarker({
          id: `${type}-${place.place_id || index}`,
          position: coords,
          type,
          title: place.name,
          placeData: place,
        });
      }
    });
  }, [addMarker]);

  // Close insights panel
  const closeInsights = useCallback(() => {
    dispatch({ type: actionTypes.SET_SHOW_INSIGHTS, payload: false });
    dispatch({ type: actionTypes.SET_AREA_INSIGHTS, payload: null });
    dispatch({ type: actionTypes.SET_SELECTED_LOCATION, payload: null });
  }, []);

  // Refresh insights for current location
  const refreshInsights = useCallback(() => {
    if (state.selectedLocation) {
      handleMapClick(state.selectedLocation);
    }
  }, [state.selectedLocation, handleMapClick]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Map actions
    initializeMap,
    getCurrentLocation,
    searchAddress,
    centerMapOnLocation,
    
    // Marker actions
    addMarker,
    removeMarker,
    updateMarker,
    clearMarkers,
    addPlaceMarkers,
    
    // Insights actions
    handleMapClick,
    closeInsights,
    refreshInsights,
    
    // Utilities
    getMarkerIcon,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

// Custom hook to use the context
export function useMap() {
  const context = useContext(MapContext);
  
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  
  return context;
}

export default MapContext;

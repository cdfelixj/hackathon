import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';
import { useMap } from '../contexts/MapContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import AreaInsights from './AreaInsights';
import SearchBar from './SearchBar';
import MapControls from './MapControls';
import LoadingSpinner from './LoadingSpinner';

const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
`;

const MapElement = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  
  .loading-text {
    margin-top: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.fontSizes.lg};
    color: ${props => props.theme.colors.textSecondary};
    text-align: center;
  }
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.lg};
  text-align: center;
  z-index: 1000;
  max-width: 400px;
  
  h3 {
    color: ${props => props.theme.colors.error};
    margin-bottom: ${props => props.theme.spacing.md};
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: ${props => props.theme.spacing.lg};
    line-height: 1.5;
  }
  
  button {
    background: ${props => props.theme.colors.primary};
    color: white;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
    border: none;
    border-radius: ${props => props.theme.borderRadius.md};
    cursor: pointer;
    font-weight: ${props => props.theme.fontWeights.medium};
    transition: background ${props => props.theme.transitions.fast};
    
    &:hover {
      background: ${props => props.theme.colors.primaryDark};
    }
  }
`;

const FloatingControls = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.lg};
  left: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  display: flex;
  gap: ${props => props.theme.spacing.md};
  z-index: 100;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    top: ${props => props.theme.spacing.md};
    left: ${props => props.theme.spacing.md};
    right: ${props => props.theme.spacing.md};
    flex-direction: column;
  }
`;

function MapContainer() {
  const mapRef = useRef(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  
  const {
    map,
    isMapLoaded,
    isLoadingInsights,
    error,
    showInsights,
    initializeMap,
    getCurrentLocation,
  } = useMap();
  
  const { isPreferencesComplete } = useUserPreferences();

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setMapError('Google Maps API key is not configured');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsGoogleMapsLoaded(true);
      };
      
      script.onerror = () => {
        setMapError('Failed to load Google Maps API');
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && mapRef.current && !map) {
      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: {
            lat: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LAT) || 40.7128,
            lng: parseFloat(process.env.REACT_APP_DEFAULT_MAP_CENTER_LNG) || -74.0060,
          },
          zoom: parseInt(process.env.REACT_APP_DEFAULT_MAP_ZOOM) || 12,
          styles: getMapStyles(),
          options: {
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: false,
            fullscreenControl: true,
            gestureHandling: 'greedy',
          },
          mapTypeId: 'roadmap',
        });

        initializeMap(mapInstance);
        
        // Show welcome message
        if (isPreferencesComplete) {
          toast.success('Click anywhere on the map to discover amazing places!', {
            duration: 5000,
          });
        } else {
          toast('Configure your preferences in Settings for personalized recommendations!', {
            duration: 6000,
            icon: '⚙️',
          });
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize Google Maps');
      }
    }
  }, [isGoogleMapsLoaded, map, initializeMap, isPreferencesComplete]);

  // Get user's current location on first load
  useEffect(() => {
    if (isMapLoaded) {
      const hasAskedForLocation = localStorage.getItem('hasAskedForLocation');
      
      if (!hasAskedForLocation) {
        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span>Would you like to use your current location?</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  getCurrentLocation()
                    .then(() => {
                      toast.success('Location updated!');
                    })
                    .catch(() => {
                      toast.error('Could not get your location');
                    });
                  localStorage.setItem('hasAskedForLocation', 'true');
                }}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Yes
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  localStorage.setItem('hasAskedForLocation', 'true');
                }}
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                No thanks
              </button>
            </div>
          </div>
        ), {
          duration: 8000,
        });
      }
    }
  }, [isMapLoaded, getCurrentLocation]);

  // Handle retry for map errors
  const handleRetry = () => {
    setMapError(null);
    window.location.reload();
  };

  // Get map styles
  const getMapStyles = () => [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'simplified' }]
    },
    {
      featureType: 'road',
      elementType: 'labels',
      stylers: [{ visibility: 'simplified' }]
    },
    {
      featureType: 'water',
      stylers: [{ color: '#4285f4' }]
    }
  ];

  if (mapError) {
    return (
      <MapWrapper>
        <ErrorOverlay>
          <h3>Map Error</h3>
          <p>{mapError}</p>
          <button onClick={handleRetry}>
            Try Again
          </button>
        </ErrorOverlay>
      </MapWrapper>
    );
  }

  return (
    <MapWrapper>
      <FloatingControls>
        <SearchBar />
        <MapControls />
      </FloatingControls>

      <MapElement ref={mapRef} />

      {!isGoogleMapsLoaded && (
        <LoadingOverlay>
          <LoadingSpinner size="large" />
          <div className="loading-text">
            Loading Google Maps...
          </div>
        </LoadingOverlay>
      )}

      {isLoadingInsights && (
        <LoadingOverlay>
          <LoadingSpinner size="large" />
          <div className="loading-text">
            Discovering amazing places nearby...
          </div>
        </LoadingOverlay>
      )}

      {showInsights && <AreaInsights />}

      {error && (
        <ErrorOverlay>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </ErrorOverlay>
      )}
    </MapWrapper>
  );
}

export default MapContainer;

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useMap } from '../contexts/MapContext';

const ControlsContainer = styled.div`
  position: absolute;
  bottom: ${props => props.theme.spacing.lg};
  left: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  z-index: 100;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    bottom: ${props => props.theme.spacing.md};
    left: ${props => props.theme.spacing.md};
  }
`;

const ControlGroup = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
`;

const ControlButton = styled(motion.button)`
  width: 48px;
  height: 48px;
  border: none;
  background: white;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${props => props.theme.transitions.fast};
  border-bottom: 1px solid ${props => props.theme.colors.borderLight};
  position: relative;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.primary};
  }

  &:active {
    background: ${props => props.theme.colors.primaryLight};
  }

  &:disabled {
    color: ${props => props.theme.colors.textLight};
    cursor: not-allowed;
    
    &:hover {
      background: white;
      color: ${props => props.theme.colors.textLight};
    }
  }

  i {
    font-size: 16px;
  }

  /* Active indicator */
  ${props => props.active && `
    background: ${props.theme.colors.primaryLight};
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${props.theme.colors.primary};
    }
  `}
`;

const ZoomControls = styled(ControlGroup)`
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ZoomButton = styled(ControlButton)`
  font-size: 18px;
  font-weight: bold;
`;

const LayerToggle = styled.div`
  position: absolute;
  bottom: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  z-index: 100;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    bottom: ${props => props.theme.spacing.md};
    right: ${props => props.theme.spacing.md};
  }
`;

const LayerButton = styled(motion.button)`
  width: 48px;
  height: 48px;
  border: none;
  background: white;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.primary};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  i {
    font-size: 16px;
  }
`;

const TooltipContainer = styled.div`
  position: relative;
`;

const Tooltip = styled(motion.div)`
  position: absolute;
  right: calc(100% + ${props => props.theme.spacing.sm});
  top: 50%;
  transform: translateY(-50%);
  background: ${props => props.theme.colors.text};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.sm};
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;

  &::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 4px solid transparent;
    border-left-color: ${props => props.theme.colors.text};
  }
`;

const LocationStatus = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  max-width: 200px;
  margin-top: ${props => props.theme.spacing.sm};

  .status-text {
    font-weight: ${props => props.theme.fontWeights.medium};
    color: ${props => props.theme.colors.text};
    margin-bottom: ${props => props.theme.spacing.xs};
  }
`;

function MapControls() {
  const [showTooltip, setShowTooltip] = useState(null);
  const [satelliteView, setSatelliteView] = useState(false);
  
  const { 
    mapInstance, 
    getCurrentLocation, 
    toggleTrafficLayer,
    isTrafficLayerVisible,
    userLocation,
    isLoadingLocation
  } = useMap();

  const handleZoomIn = () => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom();
      mapInstance.setZoom(Math.max(1, currentZoom - 1));
    }
  };

  const handleMyLocation = async () => {
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleToggleSatellite = () => {
    if (mapInstance) {
      const newMapType = satelliteView ? 'roadmap' : 'satellite';
      mapInstance.setMapTypeId(newMapType);
      setSatelliteView(!satelliteView);
    }
  };

  const handleToggleTraffic = () => {
    toggleTrafficLayer();
  };

  const controls = [
    {
      id: 'location',
      icon: isLoadingLocation ? 'fas fa-spinner fa-spin' : 'fas fa-location-arrow',
      tooltip: 'My Location',
      onClick: handleMyLocation,
      disabled: isLoadingLocation,
      active: !!userLocation
    },
    {
      id: 'satellite',
      icon: satelliteView ? 'fas fa-map' : 'fas fa-satellite',
      tooltip: satelliteView ? 'Road Map' : 'Satellite View',
      onClick: handleToggleSatellite,
      active: satelliteView
    },
    {
      id: 'traffic',
      icon: 'fas fa-traffic-light',
      tooltip: isTrafficLayerVisible ? 'Hide Traffic' : 'Show Traffic',
      onClick: handleToggleTraffic,
      active: isTrafficLayerVisible
    }
  ];

  return (
    <>
      <ControlsContainer>
        {/* Zoom Controls */}
        <ZoomControls>
          <ZoomButton
            onClick={handleZoomIn}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setShowTooltip('zoom-in')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            +
          </ZoomButton>
          <ZoomButton
            onClick={handleZoomOut}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setShowTooltip('zoom-out')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            −
          </ZoomButton>
        </ZoomControls>

        {/* Main Controls */}
        <ControlGroup>
          {controls.map(control => (
            <TooltipContainer key={control.id}>
              <ControlButton
                active={control.active}
                disabled={control.disabled}
                onClick={control.onClick}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setShowTooltip(control.id)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <i className={control.icon}></i>
              </ControlButton>
              
              {showTooltip === control.id && (
                <Tooltip
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {control.tooltip}
                </Tooltip>
              )}
            </TooltipContainer>
          ))}
        </ControlGroup>

        {/* Location Status */}
        {userLocation && (
          <LocationStatus>
            <div className="status-text">Current Location</div>
            <div>
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </div>
          </LocationStatus>
        )}
      </ControlsContainer>

      {/* Layer Toggle (separate positioning) */}
      <LayerToggle>
        <TooltipContainer>
          <LayerButton
            onClick={() => {
              // Toggle between different map styles
              if (mapInstance) {
                const currentType = mapInstance.getMapTypeId();
                const nextType = currentType === 'roadmap' ? 'terrain' : 'roadmap';
                mapInstance.setMapTypeId(nextType);
              }
            }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setShowTooltip('layers')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <i className="fas fa-layer-group"></i>
          </LayerButton>
          
          {showTooltip === 'layers' && (
            <Tooltip
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              Map Layers
            </Tooltip>
          )}
        </TooltipContainer>
      </LayerToggle>

      {/* Zoom Tooltips */}
      {showTooltip === 'zoom-in' && (
        <div style={{ 
          position: 'absolute', 
          bottom: '140px', 
          left: '60px', 
          zIndex: 1000 
        }}>
          <Tooltip
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            Zoom In
          </Tooltip>
        </div>
      )}
      
      {showTooltip === 'zoom-out' && (
        <div style={{ 
          position: 'absolute', 
          bottom: '92px', 
          left: '60px', 
          zIndex: 1000 
        }}>
          <Tooltip
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            Zoom Out
          </Tooltip>
        </div>
      )}
    </>
  );
}

export default MapControls;

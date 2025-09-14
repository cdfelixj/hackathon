import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  padding-right: 40px; /* Space for close button */
`;

const LocationName = styled.h2`
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: ${props => props.theme.fontWeights.bold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  line-height: 1.2;
`;

const LocationCoords = styled.p`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  font-family: monospace;
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.sm};
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.primaryLight};
  color: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fontWeights.medium};

  i {
    font-size: 12px;
  }
`;

const PersonalizedBadge = styled(StatBadge)`
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  
  &::before {
    content: '✨';
    margin-right: 2px;
  }
`;

function InsightsHeader({ location, totalRecommendations }) {
  const formatLocationName = (location) => {
    if (!location) return 'Selected Area';
    
    // If we have a formatted address, use the first part
    if (location.formatted_address) {
      const parts = location.formatted_address.split(',');
      return parts[0].trim();
    }
    
    // If we have coordinates, format them nicely
    if (location.lat && location.lng) {
      return `Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
    }
    
    return 'Selected Area';
  };

  const formatCoordinates = (location) => {
    if (!location || !location.lat || !location.lng) return null;
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  };

  return (
    <HeaderContainer>
      <LocationName>{formatLocationName(location)}</LocationName>
      
      {formatCoordinates(location) && (
        <LocationCoords>{formatCoordinates(location)}</LocationCoords>
      )}
      
      <StatsRow>
        {totalRecommendations > 0 && (
          <PersonalizedBadge>
            {totalRecommendations} picks for you
          </PersonalizedBadge>
        )}
        
        <StatBadge>
          <i className="fas fa-clock"></i>
          Live data
        </StatBadge>
      </StatsRow>
    </HeaderContainer>
  );
}

export default InsightsHeader;

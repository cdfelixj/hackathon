import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  transition: all ${props => props.theme.transitions.fast};
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => props.theme.colors.primary};
    opacity: ${props => props.rank <= 3 ? 1 : 0};
    transition: opacity ${props => props.theme.transitions.fast};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlaceName = styled.h4`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fontWeights.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  line-height: 1.3;
  flex: 1;
  padding-right: ${props => props.theme.spacing.sm};
`;

const RankBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: ${props => {
    if (props.rank === 1) return props.theme.colors.success;
    if (props.rank === 2) return '#fbbf24';
    if (props.rank === 3) return '#f59e0b';
    return props.theme.colors.textLight;
  }};
  color: white;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: ${props => props.theme.fontWeights.bold};
  flex-shrink: 0;
`;

const PlaceDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const DetailBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.textSecondary};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: ${props => props.theme.fontSizes.xs};

  i {
    font-size: 10px;
  }
`;

const RatingBadge = styled(DetailBadge)`
  background: ${props => {
    const rating = props.rating;
    if (rating >= 4.5) return '#dcfce7';
    if (rating >= 4.0) return '#fef3c7';
    if (rating >= 3.5) return '#fed7d7';
    return props.theme.colors.surface;
  }};
  color: ${props => {
    const rating = props.rating;
    if (rating >= 4.5) return '#16a34a';
    if (rating >= 4.0) return '#d97706';
    if (rating >= 3.5) return '#dc2626';
    return props.theme.colors.textSecondary;
  }};
  font-weight: ${props => props.theme.fontWeights.medium};
`;

const PersonalizedScore = styled.div`
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: ${props => props.theme.fontWeights.medium};
  margin-top: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &::before {
    content: '⭐';
  }
`;

const PlaceTypes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
`;

const TypeTag = styled.span`
  font-size: ${props => props.theme.fontSizes.xs};
  color: ${props => props.theme.colors.textLight};
  background: ${props => props.theme.colors.borderLight};
  padding: 2px ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  text-transform: capitalize;
`;

const OpenStatus = styled(DetailBadge)`
  background: ${props => props.isOpen ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.isOpen ? '#16a34a' : '#dc2626'};
  font-weight: ${props => props.theme.fontWeights.medium};
`;

function PlaceCard({ place, rank, showPersonalizedScore = false }) {
  const formatTypes = (types) => {
    if (!types || !Array.isArray(types)) return [];
    
    // Filter out generic types and format nicely
    const filteredTypes = types
      .filter(type => !['establishment', 'point_of_interest'].includes(type))
      .slice(0, 3);
    
    return filteredTypes.map(type => 
      type.replace(/_/g, ' ').toLowerCase()
    );
  };

  const getOpenStatus = (place) => {
    if (!place.opening_hours) return null;
    
    return {
      isOpen: place.opening_hours.open_now,
      text: place.opening_hours.open_now ? 'Open now' : 'Closed'
    };
  };

  const getPriceLevel = (level) => {
    if (!level) return null;
    return '💰'.repeat(level);
  };

  const openStatus = getOpenStatus(place);
  const priceLevel = getPriceLevel(place.price_level);
  const types = formatTypes(place.types);

  return (
    <CardContainer rank={rank}>
      <CardHeader>
        <PlaceName>{place.name}</PlaceName>
        <RankBadge rank={rank}>{rank}</RankBadge>
      </CardHeader>

      <PlaceDetails>
        {place.rating && (
          <RatingBadge rating={place.rating}>
            <i className="fas fa-star"></i>
            {place.rating.toFixed(1)}
            {place.user_ratings_total && (
              <span>({place.user_ratings_total})</span>
            )}
          </RatingBadge>
        )}

        {openStatus && (
          <OpenStatus isOpen={openStatus.isOpen}>
            <i className={`fas fa-${openStatus.isOpen ? 'clock' : 'times'}`}></i>
            {openStatus.text}
          </OpenStatus>
        )}

        {priceLevel && (
          <DetailBadge>
            <span>{priceLevel}</span>
          </DetailBadge>
        )}

        {place.vicinity && (
          <DetailBadge>
            <i className="fas fa-map-marker-alt"></i>
            {place.vicinity}
          </DetailBadge>
        )}
      </PlaceDetails>

      {showPersonalizedScore && place.personalizedScore && (
        <PersonalizedScore>
          {Math.round(place.personalizedScore)}% match for you
        </PersonalizedScore>
      )}

      {types.length > 0 && (
        <PlaceTypes>
          {types.map((type, index) => (
            <TypeTag key={index}>{type}</TypeTag>
          ))}
        </PlaceTypes>
      )}
    </CardContainer>
  );
}

export default PlaceCard;

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMap } from '../contexts/MapContext';
import PlaceCard from './PlaceCard';
import InsightsHeader from './InsightsHeader';
import CategoryTabs from './CategoryTabs';
import PeakTimesChart from './PeakTimesChart';

const InsightsPanel = styled(motion.div)`
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 100%;
  background: white;
  box-shadow: ${props => props.theme.shadows.xl};
  z-index: 200;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    width: 350px;
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    top: auto;
    bottom: 0;
    height: 70vh;
    border-radius: ${props => props.theme.borderRadius.xl} ${props => props.theme.borderRadius.xl} 0 0;
  }
`;

const PanelHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.surface};
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  width: 32px;
  height: 32px;
  border: none;
  background: ${props => props.theme.colors.surfaceHover};
  border-radius: ${props => props.theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.border};
    transform: scale(1.05);
  }

  i {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 14px;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.borderLight};
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.textLight};
    border-radius: 3px;

    &:hover {
      background: ${props => props.theme.colors.textSecondary};
    }
  }
`;

const TabContent = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fontWeights.semibold};
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  i {
    color: ${props => props.theme.colors.primary};
  }
`;

const PlacesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.textSecondary};

  i {
    font-size: 3rem;
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.textLight};
  }

  h4 {
    margin-bottom: ${props => props.theme.spacing.sm};
    color: ${props => props.theme.colors.text};
  }
`;

const RecommendationsSummary = styled.div`
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};

  h4 {
    margin-bottom: ${props => props.theme.spacing.sm};
    font-size: ${props => props.theme.fontSizes.lg};
  }

  p {
    opacity: 0.9;
    line-height: 1.5;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg};

  .stat-card {
    background: ${props => props.theme.colors.surface};
    padding: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.lg};
    border: 1px solid ${props => props.theme.colors.border};
    text-align: center;

    .stat-value {
      font-size: ${props => props.theme.fontSizes.xl};
      font-weight: ${props => props.theme.fontWeights.bold};
      color: ${props => props.theme.colors.primary};
      margin-bottom: ${props => props.theme.spacing.xs};
    }

    .stat-label {
      font-size: ${props => props.theme.fontSizes.sm};
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`;

function AreaInsights() {
  const { areaInsights, closeInsights, selectedLocation } = useMap();
  const [activeTab, setActiveTab] = useState('recommendations');

  if (!areaInsights) return null;

  const tabs = [
    { id: 'recommendations', label: 'Top Picks', icon: 'fas fa-star' },
    { id: 'restaurants', label: 'Dining', icon: 'fas fa-utensils' },
    { id: 'attractions', label: 'Attractions', icon: 'fas fa-camera' },
    { id: 'insights', label: 'Insights', icon: 'fas fa-chart-line' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'recommendations':
        return (
          <TabContent>
            <SectionTitle>
              <i className="fas fa-star"></i>
              Personalized Recommendations
            </SectionTitle>
            {areaInsights.topRecommendations?.length > 0 ? (
              <PlacesList>
                {areaInsights.topRecommendations.map((place, index) => (
                  <PlaceCard
                    key={place.place_id || index}
                    place={place}
                    rank={index + 1}
                    showPersonalizedScore={true}
                  />
                ))}
              </PlacesList>
            ) : (
              <EmptyState>
                <i className="fas fa-search"></i>
                <h4>No recommendations found</h4>
                <p>Try adjusting your preferences in Settings</p>
              </EmptyState>
            )}
          </TabContent>
        );

      case 'restaurants':
        return (
          <TabContent>
            <SectionTitle>
              <i className="fas fa-utensils"></i>
              Restaurants & Dining
            </SectionTitle>
            {areaInsights.categories?.restaurants?.length > 0 ? (
              <PlacesList>
                {areaInsights.categories.restaurants.map((place, index) => (
                  <PlaceCard
                    key={place.place_id || index}
                    place={place}
                    rank={index + 1}
                  />
                ))}
              </PlacesList>
            ) : (
              <EmptyState>
                <i className="fas fa-utensils"></i>
                <h4>No restaurants found</h4>
                <p>Try exploring a different area</p>
              </EmptyState>
            )}
          </TabContent>
        );

      case 'attractions':
        return (
          <TabContent>
            <SectionTitle>
              <i className="fas fa-camera"></i>
              Attractions & Landmarks
            </SectionTitle>
            {(areaInsights.categories?.attractions?.length > 0 || 
              areaInsights.categories?.landmarks?.length > 0) ? (
              <PlacesList>
                {[
                  ...(areaInsights.categories.attractions || []),
                  ...(areaInsights.categories.landmarks || [])
                ].map((place, index) => (
                  <PlaceCard
                    key={place.place_id || index}
                    place={place}
                    rank={index + 1}
                  />
                ))}
              </PlacesList>
            ) : (
              <EmptyState>
                <i className="fas fa-camera"></i>
                <h4>No attractions found</h4>
                <p>This area might be more residential</p>
              </EmptyState>
            )}
          </TabContent>
        );

      case 'insights':
        return (
          <TabContent>
            <SectionTitle>
              <i className="fas fa-chart-line"></i>
              Area Insights
            </SectionTitle>
            
            {areaInsights.personalizationSummary && (
              <RecommendationsSummary>
                <h4>Personalized for You</h4>
                <p>
                  Based on your interests in {areaInsights.personalizationSummary.personalizationFactors.interests.join(', ')}, 
                  we found {areaInsights.personalizationSummary.totalRecommendations} great places for your {areaInsights.personalizationSummary.personalizationFactors.ageGroup} preferences.
                </p>
              </RecommendationsSummary>
            )}

            <StatsGrid>
              <div className="stat-card">
                <div className="stat-value">
                  {areaInsights.areaInsights?.averageRating?.toFixed(1) || 'N/A'}
                </div>
                <div className="stat-label">Average Rating</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {areaInsights.areaInsights?.totalPlacesFound || 0}
                </div>
                <div className="stat-label">Places Found</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {areaInsights.bestVisitTime?.recommendation?.split(' ')[1] || 'Flexible'}
                </div>
                <div className="stat-label">Best Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {areaInsights.peakTimes?.currentConditions || 'Unknown'}
                </div>
                <div className="stat-label">Current Activity</div>
              </div>
            </StatsGrid>

            {areaInsights.peakTimes && (
              <div style={{ margin: '1rem' }}>
                <SectionTitle>
                  <i className="fas fa-clock"></i>
                  Peak Times Analysis
                </SectionTitle>
                <PeakTimesChart data={areaInsights.peakTimes} />
              </div>
            )}

            {areaInsights.bestVisitTime && (
              <div style={{ margin: '1rem' }}>
                <div style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                    Best Time to Visit
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500', color: '#667eea' }}>
                    {areaInsights.bestVisitTime.recommendation}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    {areaInsights.bestVisitTime.reasoning}
                  </p>
                </div>
              </div>
            )}
          </TabContent>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <InsightsPanel
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ 
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
      >
        <PanelHeader>
          <InsightsHeader 
            location={selectedLocation}
            totalRecommendations={areaInsights.topRecommendations?.length || 0}
          />
          <CloseButton onClick={closeInsights}>
            <i className="fas fa-times"></i>
          </CloseButton>
        </PanelHeader>

        <CategoryTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <PanelContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </PanelContent>
      </InsightsPanel>
    </AnimatePresence>
  );
}

export default AreaInsights;

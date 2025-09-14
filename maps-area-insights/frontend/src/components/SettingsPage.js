import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

const SettingsContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.backgroundLight};
  padding: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg};
  }
`;

const SettingsHeader = styled.div`
  max-width: 800px;
  margin: 0 auto ${props => props.theme.spacing.xl} auto;
  text-align: center;

  h1 {
    font-size: ${props => props.theme.fontSizes.xxxl};
    font-weight: ${props => props.theme.fontWeights.bold};
    color: ${props => props.theme.colors.text};
    margin-bottom: ${props => props.theme.spacing.md};
    background: ${props => props.theme.colors.gradientPrimary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: ${props => props.theme.fontSizes.lg};
    color: ${props => props.theme.colors.textSecondary};
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const SettingsContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const SettingsSection = styled(motion.div)`
  background: white;
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const SectionHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};

  h2 {
    font-size: ${props => props.theme.fontSizes.xl};
    font-weight: ${props => props.theme.fontWeights.semibold};
    color: ${props => props.theme.colors.text};
    margin-bottom: ${props => props.theme.spacing.sm};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};

    i {
      color: ${props => props.theme.colors.primary};
    }
  }

  p {
    color: ${props => props.theme.colors.textSecondary};
    line-height: 1.5;
  }
`;

const PreferenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const PreferenceCard = styled(motion.div)`
  background: ${props => props.selected ? props.theme.colors.primaryLight : props.theme.colors.surface};
  border: 2px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  cursor: pointer;
  text-align: center;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.selected ? props.theme.colors.primaryLight : props.theme.colors.surfaceHover};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  .preference-icon {
    font-size: 2rem;
    margin-bottom: ${props => props.theme.spacing.sm};
    color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.textSecondary};
  }

  .preference-title {
    font-weight: ${props => props.theme.fontWeights.semibold};
    color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.text};
    margin-bottom: ${props => props.theme.spacing.xs};
  }

  .preference-description {
    font-size: ${props => props.theme.fontSizes.sm};
    color: ${props => props.theme.colors.textSecondary};
    line-height: 1.4;
  }
`;

const AgeGroupSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const AgeGroupButton = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border: 2px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.selected ? props.theme.colors.primaryLight : 'white'};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: ${props => props.theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  flex: 1;
  min-width: 120px;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.selected ? props.theme.colors.primaryLight : props.theme.colors.surfaceHover};
  }
`;

const SaveButton = styled(motion.button)`
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: ${props => props.theme.fontWeights.semibold};
  cursor: pointer;
  width: 100%;
  margin-top: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.md};
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.lg};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .save-icon {
    margin-left: ${props => props.theme.spacing.sm};
  }
`;

const BackButton = styled.button`
  background: white;
  border: 2px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-weight: ${props => props.theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }

  i {
    font-size: ${props => props.theme.fontSizes.sm};
  }
`;

const NotificationBanner = styled(motion.div)`
  background: ${props => props.type === 'success' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.type === 'success' ? '#16a34a' : '#dc2626'};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-weight: ${props => props.theme.fontWeights.medium};

  i {
    font-size: ${props => props.theme.fontSizes.lg};
  }
`;

function SettingsPage() {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const interestCategories = [
    {
      id: 'restaurants',
      title: 'Restaurants',
      description: 'Dining, cafes, and food experiences',
      icon: '🍽️'
    },
    {
      id: 'entertainment',
      title: 'Entertainment',
      description: 'Movies, theaters, and live events',
      icon: '🎭'
    },
    {
      id: 'shopping',
      title: 'Shopping',
      description: 'Malls, boutiques, and markets',
      icon: '🛍️'
    },
    {
      id: 'outdoors',
      title: 'Outdoors',
      description: 'Parks, hiking, and nature activities',
      icon: '🌲'
    },
    {
      id: 'culture',
      title: 'Culture',
      description: 'Museums, galleries, and historic sites',
      icon: '🏛️'
    },
    {
      id: 'nightlife',
      title: 'Nightlife',
      description: 'Bars, clubs, and evening entertainment',
      icon: '🌙'
    },
    {
      id: 'fitness',
      title: 'Fitness',
      description: 'Gyms, yoga studios, and sports',
      icon: '💪'
    },
    {
      id: 'wellness',
      title: 'Wellness',
      description: 'Spas, meditation, and health',
      icon: '🧘'
    }
  ];

  const ageGroups = [
    { id: '18-25', label: '18-25' },
    { id: '26-35', label: '26-35' },
    { id: '36-45', label: '36-45' },
    { id: '46-55', label: '46-55' },
    { id: '55+', label: '55+' }
  ];

  const activityTypes = [
    {
      id: 'solo',
      title: 'Solo Adventures',
      description: 'Perfect for individual exploration',
      icon: '🚶'
    },
    {
      id: 'romantic',
      title: 'Romantic',
      description: 'Ideal for couples and date nights',
      icon: '💕'
    },
    {
      id: 'family',
      title: 'Family-Friendly',
      description: 'Great for kids and family outings',
      icon: '👨‍👩‍👧‍👦'
    },
    {
      id: 'friends',
      title: 'Friends',
      description: 'Fun group activities and hangouts',
      icon: '👥'
    }
  ];

  const handleInterestToggle = (interestId) => {
    setLocalPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleAgeGroupChange = (ageGroupId) => {
    setLocalPreferences(prev => ({
      ...prev,
      ageGroup: ageGroupId
    }));
  };

  const handleActivityTypeToggle = (activityId) => {
    setLocalPreferences(prev => ({
      ...prev,
      activityTypes: prev.activityTypes.includes(activityId)
        ? prev.activityTypes.filter(id => id !== activityId)
        : [...prev.activityTypes, activityId]
    }));
  };

  const handleSave = async () => {
    try {
      await updatePreferences(localPreferences);
      setNotification({
        type: 'success',
        message: 'Your preferences have been saved successfully!'
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to save preferences. Please try again.'
      });
    }
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <SettingsContainer>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BackButton onClick={goBack}>
          <i className="fas fa-arrow-left"></i>
          Back to Map
        </BackButton>

        {notification && (
          <NotificationBanner
            type={notification.type}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {notification.message}
          </NotificationBanner>
        )}
      </div>

      <SettingsHeader>
        <h1>Personalize Your Experience</h1>
        <p>
          Tell us about your interests and preferences to get personalized area insights 
          and recommendations tailored just for you.
        </p>
      </SettingsHeader>

      <SettingsContent>
        {/* Interests Section */}
        <SettingsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SectionHeader>
            <h2>
              <i className="fas fa-heart"></i>
              Your Interests
            </h2>
            <p>Select the types of places and activities you enjoy most. This helps us find the perfect recommendations for you.</p>
          </SectionHeader>

          <PreferenceGrid>
            {interestCategories.map(interest => (
              <PreferenceCard
                key={interest.id}
                selected={localPreferences.interests.includes(interest.id)}
                onClick={() => handleInterestToggle(interest.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="preference-icon">{interest.icon}</div>
                <div className="preference-title">{interest.title}</div>
                <div className="preference-description">{interest.description}</div>
              </PreferenceCard>
            ))}
          </PreferenceGrid>
        </SettingsSection>

        {/* Age Group Section */}
        <SettingsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SectionHeader>
            <h2>
              <i className="fas fa-user"></i>
              Age Group
            </h2>
            <p>This helps us suggest age-appropriate venues and activities that match your lifestyle.</p>
          </SectionHeader>

          <AgeGroupSelector>
            {ageGroups.map(group => (
              <AgeGroupButton
                key={group.id}
                selected={localPreferences.ageGroup === group.id}
                onClick={() => handleAgeGroupChange(group.id)}
              >
                {group.label}
              </AgeGroupButton>
            ))}
          </AgeGroupSelector>
        </SettingsSection>

        {/* Activity Types Section */}
        <SettingsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectionHeader>
            <h2>
              <i className="fas fa-users"></i>
              Activity Types
            </h2>
            <p>How do you typically like to explore? Select all that apply to get the most relevant suggestions.</p>
          </SectionHeader>

          <PreferenceGrid>
            {activityTypes.map(activity => (
              <PreferenceCard
                key={activity.id}
                selected={localPreferences.activityTypes.includes(activity.id)}
                onClick={() => handleActivityTypeToggle(activity.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="preference-icon">{activity.icon}</div>
                <div className="preference-title">{activity.title}</div>
                <div className="preference-description">{activity.description}</div>
              </PreferenceCard>
            ))}
          </PreferenceGrid>
        </SettingsSection>

        {/* Save Button */}
        <SaveButton
          onClick={handleSave}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Saving...
            </>
          ) : (
            <>
              Save Preferences
              <i className="fas fa-save save-icon"></i>
            </>
          )}
        </SaveButton>
      </SettingsContent>
    </SettingsContainer>
  );
}

export default SettingsPage;

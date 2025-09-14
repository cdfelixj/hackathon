import React from 'react';
import styled from 'styled-components';

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.surface};
  overflow-x: auto;
  
  /* Hide scrollbar but allow scrolling */
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button`
  flex: 1;
  min-width: 100px;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.sm};
  border: none;
  background: transparent;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fontWeights.medium};
  cursor: pointer;
  position: relative;
  transition: all ${props => props.theme.transitions.fast};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &:hover {
    color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.surfaceHover};
  }

  i {
    font-size: 16px;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
    transition: background ${props => props.theme.transitions.fast};
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    min-width: 80px;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.xs};
    font-size: ${props => props.theme.fontSizes.xs};
    
    i {
      font-size: 14px;
    }
  }
`;

const TabLabel = styled.span`
  white-space: nowrap;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    display: none;
  }
`;

const TabIcon = styled.i`
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 18px !important;
  }
`;

function CategoryTabs({ tabs, activeTab, onTabChange }) {
  return (
    <TabsContainer>
      {tabs.map(tab => (
        <Tab
          key={tab.id}
          active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          <TabIcon className={tab.icon} />
          <TabLabel>{tab.label}</TabLabel>
        </Tab>
      ))}
    </TabsContainer>
  );
}

export default CategoryTabs;

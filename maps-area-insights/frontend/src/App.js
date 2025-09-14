import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { MapProvider } from './contexts/MapContext';
import GlobalStyles from './styles/GlobalStyles';
import theme from './styles/theme';
import MapContainer from './components/MapContainer';
import SearchBar from './components/SearchBar';
import MapControls from './components/MapControls';
import AreaInsights from './components/AreaInsights';
import SettingsPage from './components/SettingsPage';
import styled from 'styled-components';

const AppContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const MapPageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const SettingsLink = styled.a`
  position: absolute;
  top: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  z-index: 150;
  background: white;
  color: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.lg};
  text-decoration: none;
  font-weight: ${props => props.theme.fontWeights.medium};
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  transition: all ${props => props.theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &:hover {
    background: ${props => props.theme.colors.surfaceHover};
    box-shadow: ${props => props.theme.shadows.lg};
    transform: translateY(-1px);
  }

  i {
    font-size: 14px;
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    top: ${props => props.theme.spacing.md};
    right: ${props => props.theme.spacing.md};
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    font-size: ${props => props.theme.fontSizes.sm};
  }
`;

function MapPage() {
  return (
    <MapPageContainer>
      <MapContainer />
      <SearchBar />
      <MapControls />
      <AreaInsights />
      <SettingsLink href="/settings">
        <i className="fas fa-cog"></i>
        Settings
      </SettingsLink>
    </MapPageContainer>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <UserPreferencesProvider>
        <Router>
          <AppContainer>
            <Routes>
              <Route path="/" element={
                <MapProvider>
                  <MapPage />
                </MapProvider>
              } />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppContainer>
        </Router>
      </UserPreferencesProvider>
    </ThemeProvider>
  );
}

export default App;

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { ThemeProvider } from 'styled-components';
import { useUserPreferences } from './contexts/UserPreferencesContext';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import SettingsPage from './components/SettingsPage';
import AboutPage from './components/AboutPage';
import { GlobalStyle, theme } from './styles/GlobalStyles';
import { initializeAnalytics } from './utils/analytics';

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  font-family: ${props => props.theme.fonts.primary};
`;

const MainContent = styled.main`
  padding-top: 60px; /* Account for fixed header */
  min-height: calc(100vh - 60px);
`;

function App() {
  const { loadPreferences } = useUserPreferences();

  useEffect(() => {
    // Initialize analytics
    if (process.env.REACT_APP_ENABLE_ANALYTICS === 'true') {
      initializeAnalytics();
    }

    // Load user preferences on app start
    loadPreferences();
  }, [loadPreferences]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Header />
        <MainContent>
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/"
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MapContainer />
                  </motion.div>
                }
              />
              <Route
                path="/settings"
                element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SettingsPage />
                  </motion.div>
                }
              />
              <Route
                path="/about"
                element={
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AboutPage />
                  </motion.div>
                }
              />
            </Routes>
          </AnimatePresence>
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;

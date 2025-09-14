import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useMap } from '../contexts/MapContext';

const SearchContainer = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.lg};
  left: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  z-index: 100;
  max-width: 500px;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    left: ${props => props.theme.spacing.md};
    right: ${props => props.theme.spacing.md};
    max-width: none;
  }
`;

const SearchBox = styled.div`
  position: relative;
  background: white;
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  transition: all ${props => props.theme.transitions.fast};

  &:focus-within {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.xl};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  padding-right: ${props => props.theme.spacing.xl};
  border: none;
  outline: none;
  font-size: ${props => props.theme.fontSizes.md};
  color: ${props => props.theme.colors.text};
  background: transparent;

  &::placeholder {
    color: ${props => props.theme.colors.textLight};
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: ${props => props.theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  background: ${props => props.theme.colors.primary};
  color: white;
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-50%) scale(1.05);
  }

  &:disabled {
    background: ${props => props.theme.colors.textLight};
    cursor: not-allowed;
    transform: translateY(-50%) scale(1);
  }

  i {
    font-size: 14px;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 52px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: ${props => props.theme.colors.surfaceHover};
  color: ${props => props.theme.colors.textSecondary};
  border-radius: ${props => props.theme.borderRadius.full};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${props => props.theme.transitions.fast};
  opacity: ${props => props.show ? 1 : 0};
  pointer-events: ${props => props.show ? 'auto' : 'none'};

  &:hover {
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
  }

  i {
    font-size: 10px;
  }
`;

const SuggestionsContainer = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-top: none;
  border-radius: 0 0 ${props => props.theme.borderRadius.xl} ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;

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

const SuggestionItem = styled.div`
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme.colors.borderLight};
  transition: background ${props => props.theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &:hover, &.highlighted {
    background: ${props => props.theme.colors.surfaceHover};
  }

  &:last-child {
    border-bottom: none;
  }

  .suggestion-icon {
    width: 20px;
    color: ${props => props.theme.colors.textSecondary};
    font-size: 12px;
    text-align: center;
  }

  .suggestion-content {
    flex: 1;
    
    .suggestion-title {
      font-weight: ${props => props.theme.fontWeights.medium};
      color: ${props => props.theme.colors.text};
      margin-bottom: 2px;
    }
    
    .suggestion-subtitle {
      font-size: ${props => props.theme.fontSizes.sm};
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`;

const RecentSearches = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.borderLight};
  background: ${props => props.theme.colors.surface};

  .recent-header {
    font-size: ${props => props.theme.fontSizes.sm};
    font-weight: ${props => props.theme.fontWeights.medium};
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: ${props => props.theme.spacing.sm};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.xs};

    i {
      font-size: 10px;
    }
  }
`;

const QuickActions = styled.div`
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.surface};
  border-top: 1px solid ${props => props.theme.colors.borderLight};

  .quick-action {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    cursor: pointer;
    border-radius: ${props => props.theme.borderRadius.md};
    transition: background ${props => props.theme.transitions.fast};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
    font-size: ${props => props.theme.fontSizes.sm};
    color: ${props => props.theme.colors.primary};
    font-weight: ${props => props.theme.fontWeights.medium};

    &:hover {
      background: ${props => props.theme.colors.primaryLight};
    }

    i {
      font-size: 12px;
    }
  }
`;

function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchInputRef = useRef(null);
  const { searchLocation, searchHistory, getCurrentLocation } = useMap();

  // Debounced search for suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const fetchSuggestions = async (searchQuery) => {
    try {
      setIsLoading(true);
      
      // Using Google Places Autocomplete API
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions(
        {
          input: searchQuery,
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' } // Adjust as needed
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const formattedSuggestions = predictions.slice(0, 8).map(prediction => ({
              id: prediction.place_id,
              title: prediction.structured_formatting.main_text,
              subtitle: prediction.structured_formatting.secondary_text,
              fullText: prediction.description,
              types: prediction.types
            }));
            setSuggestions(formattedSuggestions);
          } else {
            setSuggestions([]);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setHighlightedIndex(-1);
    
    if (value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (query.trim() || searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay hiding to allow for click events on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    const totalItems = suggestions.length + (searchHistory.length > 0 ? searchHistory.length : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(getSuggestionByIndex(highlightedIndex));
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        searchInputRef.current?.blur();
        break;
    }
  };

  const getSuggestionByIndex = (index) => {
    if (searchHistory.length > 0) {
      if (index < searchHistory.length) {
        return {
          id: `history-${index}`,
          title: searchHistory[index].query,
          subtitle: 'Recent search',
          isHistory: true,
          location: searchHistory[index].location
        };
      }
      return suggestions[index - searchHistory.length];
    }
    return suggestions[index];
  };

  const handleSuggestionClick = async (suggestion) => {
    if (suggestion.isHistory) {
      // Use stored location from history
      setQuery(suggestion.title);
      await searchLocation(suggestion.location, suggestion.title);
    } else {
      // Geocode the selected place
      setQuery(suggestion.fullText || suggestion.title);
      setIsLoading(true);
      
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { placeId: suggestion.id },
          async (results, status) => {
            if (status === 'OK' && results[0]) {
              const location = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
                formatted_address: results[0].formatted_address
              };
              await searchLocation(location, suggestion.fullText || suggestion.title);
            }
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('Error geocoding place:', error);
        setIsLoading(false);
      }
    }
    
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { address: query },
        async (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
              formatted_address: results[0].formatted_address
            };
            await searchLocation(location, query);
          } else {
            // Handle search error
            console.error('Geocoding failed:', status);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error searching location:', error);
      setIsLoading(false);
    }
    
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      await getCurrentLocation();
      setQuery('Current Location');
    } catch (error) {
      console.error('Error getting current location:', error);
    }
    setIsLoading(false);
    setShowSuggestions(false);
  };

  const getIconForSuggestion = (suggestion) => {
    if (suggestion.isHistory) return 'fas fa-history';
    
    const types = suggestion.types || [];
    if (types.includes('establishment')) return 'fas fa-store';
    if (types.includes('locality')) return 'fas fa-city';
    if (types.includes('route')) return 'fas fa-road';
    return 'fas fa-map-marker-alt';
  };

  return (
    <SearchContainer>
      <SearchBox>
        <SearchInput
          ref={searchInputRef}
          type="text"
          placeholder="Search for places, addresses, or landmarks..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
        
        <ClearButton 
          show={query.length > 0}
          onClick={handleClear}
        >
          <i className="fas fa-times"></i>
        </ClearButton>
        
        <SearchButton
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
        >
          <i className={isLoading ? "fas fa-spinner fa-spin" : "fas fa-search"}></i>
        </SearchButton>
      </SearchBox>

      <AnimatePresence>
        {showSuggestions && (
          <SuggestionsContainer
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {searchHistory.length > 0 && !query.trim() && (
              <RecentSearches>
                <div className="recent-header">
                  <i className="fas fa-history"></i>
                  Recent Searches
                </div>
                {searchHistory.slice(0, 3).map((item, index) => (
                  <SuggestionItem
                    key={`history-${index}`}
                    className={highlightedIndex === index ? 'highlighted' : ''}
                    onClick={() => handleSuggestionClick({
                      id: `history-${index}`,
                      title: item.query,
                      subtitle: 'Recent search',
                      isHistory: true,
                      location: item.location
                    })}
                  >
                    <div className="suggestion-icon">
                      <i className="fas fa-history"></i>
                    </div>
                    <div className="suggestion-content">
                      <div className="suggestion-title">{item.query}</div>
                      <div className="suggestion-subtitle">Recent search</div>
                    </div>
                  </SuggestionItem>
                ))}
              </RecentSearches>
            )}

            {suggestions.map((suggestion, index) => {
              const adjustedIndex = searchHistory.length > 0 && !query.trim() 
                ? index + searchHistory.length 
                : index;
              
              return (
                <SuggestionItem
                  key={suggestion.id}
                  className={highlightedIndex === adjustedIndex ? 'highlighted' : ''}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-icon">
                    <i className={getIconForSuggestion(suggestion)}></i>
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-title">{suggestion.title}</div>
                    {suggestion.subtitle && (
                      <div className="suggestion-subtitle">{suggestion.subtitle}</div>
                    )}
                  </div>
                </SuggestionItem>
              );
            })}

            {!query.trim() && (
              <QuickActions>
                <div className="quick-action" onClick={handleCurrentLocation}>
                  <i className="fas fa-location-arrow"></i>
                  Use Current Location
                </div>
              </QuickActions>
            )}
          </SuggestionsContainer>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
}

export default SearchBar;

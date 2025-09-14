import React from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const ChartContainer = styled.div`
  background: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  margin-top: ${props => props.theme.spacing.md};
`;

const ChartTitle = styled.h4`
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: ${props => props.theme.fontWeights.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  i {
    color: ${props => props.theme.colors.primary};
  }
`;

const ChartWrapper = styled.div`
  height: 200px;
  width: 100%;
`;

const LegendContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textSecondary};

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background: ${props => props.color};
  }
`;

function PeakTimesChart({ data }) {
  if (!data || !data.hourlyData) {
    return (
      <ChartContainer>
        <ChartTitle>
          <i className="fas fa-chart-bar"></i>
          Peak Times Analysis
        </ChartTitle>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#64748b' 
        }}>
          No peak times data available
        </div>
      </ChartContainer>
    );
  }

  // Transform the hourly data for the chart
  const chartData = data.hourlyData.map((hour, index) => ({
    hour: hour.hour,
    displayHour: formatHour(hour.hour),
    activity: hour.popularity || 0,
    isCurrentHour: isCurrentHour(hour.hour),
    isPeakTime: hour.popularity >= 70
  }));

  function formatHour(hour) {
    const h = parseInt(hour);
    if (h === 0) return '12AM';
    if (h === 12) return '12PM';
    if (h < 12) return `${h}AM`;
    return `${h - 12}PM`;
  }

  function isCurrentHour(hour) {
    const currentHour = new Date().getHours();
    return parseInt(hour) === currentHour;
  }

  const getBarColor = (entry) => {
    if (entry.isCurrentHour) return '#667eea'; // Current hour - primary color
    if (entry.isPeakTime) return '#f56565'; // Peak time - red
    if (entry.activity >= 50) return '#ed8936'; // Busy - orange
    if (entry.activity >= 30) return '#38b2ac'; // Moderate - teal
    return '#cbd5e0'; // Low activity - gray
  };

  return (
    <ChartContainer>
      <ChartTitle>
        <i className="fas fa-chart-bar"></i>
        Activity Throughout the Day
      </ChartTitle>
      
      <ChartWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis 
              dataKey="displayHour"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={1}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#64748b' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Bar dataKey="activity" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <LegendContainer>
        <LegendItem color="#667eea">Current Hour</LegendItem>
        <LegendItem color="#f56565">Peak Time</LegendItem>
        <LegendItem color="#ed8936">Busy</LegendItem>
        <LegendItem color="#38b2ac">Moderate</LegendItem>
        <LegendItem color="#cbd5e0">Quiet</LegendItem>
      </LegendContainer>

      {data.currentConditions && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontWeight: '500', 
            color: '#1e293b',
            marginBottom: '0.25rem' 
          }}>
            Right Now
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#64748b' 
          }}>
            This area is <strong>{data.currentConditions.toLowerCase()}</strong>
          </div>
        </div>
      )}
    </ChartContainer>
  );
}

export default PeakTimesChart;

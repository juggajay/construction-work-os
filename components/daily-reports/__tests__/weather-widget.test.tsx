import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherWidget } from '../weather-widget';

describe('WeatherWidget', () => {
  it('should render no weather data message when condition is missing', () => {
    render(<WeatherWidget />);
    expect(screen.getByText('No weather data')).toBeInTheDocument();
  });

  it('should render weather condition', () => {
    render(
      <WeatherWidget
        condition="clear"
        temperatureHigh={75}
        temperatureLow={55}
      />
    );
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText(/clear/i)).toBeInTheDocument();
  });

  it('should render temperatures', () => {
    render(
      <WeatherWidget
        condition="partly_cloudy"
        temperatureHigh={75}
        temperatureLow={55}
      />
    );
    expect(screen.getByText(/75°F/)).toBeInTheDocument();
    expect(screen.getByText(/55°F/)).toBeInTheDocument();
  });

  it('should render precipitation', () => {
    render(
      <WeatherWidget
        condition="rain"
        temperatureHigh={65}
        temperatureLow={50}
        precipitation={0.5}
      />
    );
    expect(screen.getByText('Precipitation:')).toBeInTheDocument();
    expect(screen.getByText('0.5"')).toBeInTheDocument();
  });

  it('should render wind speed', () => {
    render(
      <WeatherWidget
        condition="wind"
        temperatureHigh={70}
        temperatureLow={55}
        windSpeed={25}
      />
    );
    expect(screen.getByText('Wind:')).toBeInTheDocument();
    expect(screen.getByText('25 mph')).toBeInTheDocument();
  });

  it('should render humidity', () => {
    render(
      <WeatherWidget
        condition="overcast"
        temperatureHigh={68}
        temperatureLow={52}
        humidity={80}
      />
    );
    expect(screen.getByText('Humidity:')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should render compact version', () => {
    const { container } = render(
      <WeatherWidget
        condition="clear"
        temperatureHigh={75}
        temperatureLow={55}
        compact
      />
    );

    // Compact version should show icon and basic info
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText(/clear/i)).toBeInTheDocument();

    // Compact version should NOT have detailed grid
    expect(container.querySelector('.grid')).toBeNull();
  });

  it('should render full version with all details', () => {
    const { container } = render(
      <WeatherWidget
        condition="rain"
        temperatureHigh={65}
        temperatureLow={50}
        precipitation={0.5}
        windSpeed={15}
        humidity={85}
        compact={false}
      />
    );

    // Full version should have detailed grid
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <WeatherWidget condition="clear" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

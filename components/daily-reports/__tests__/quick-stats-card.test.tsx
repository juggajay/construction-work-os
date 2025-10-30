/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { QuickStatsCard } from '../quick-stats-card';
import { Users } from 'lucide-react';

describe('QuickStatsCard', () => {
  it('renders the stat card with icon, label, and value', () => {
    render(
      <QuickStatsCard
        icon={Users}
        label="Crew"
        value={24}
      />
    );

    expect(screen.getByText('Crew')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(
      <QuickStatsCard
        icon={Users}
        label="Weather"
        value="72°F Clear"
      />
    );

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('72°F Clear')).toBeInTheDocument();
  });

  it('displays the correct icon', () => {
    const { container } = render(
      <QuickStatsCard
        icon={Users}
        label="Crew"
        value={10}
      />
    );

    // Check that the icon is rendered (Lucide icons are SVGs)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

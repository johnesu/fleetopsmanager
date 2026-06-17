import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Vehicles" value={42} />);
    expect(screen.getByText('Vehicles')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard title="Vehicles" value={42} subtitle="+2 this month" />);
    expect(screen.getByText('+2 this month')).toBeDefined();
  });

  it('renders icon emoji when provided', () => {
    render(<StatCard title="Vehicles" value={42} icon="🚗" />);
    expect(screen.getByText('🚗')).toBeDefined();
  });

  it('renders icon with color class', () => {
    render(<StatCard title="Vehicles" value={42} icon="🚗" color="blue" />);
    const iconContainer = screen.getByText('🚗').closest('div');
    expect(iconContainer?.className).toContain('bg-blue-50');
  });

  it('defaults to primary color for icon', () => {
    render(<StatCard title="Vehicles" value={42} icon="🚗" />);
    const iconContainer = screen.getByText('🚗').closest('div');
    expect(iconContainer?.className).toContain('bg-primary/10');
  });

  it('renders string value', () => {
    render(<StatCard title="Rate" value="98%" />);
    expect(screen.getByText('98%')).toBeDefined();
  });

  it('renders zero value', () => {
    render(<StatCard title="Issues" value={0} />);
    expect(screen.getByText('0')).toBeDefined();
  });
});

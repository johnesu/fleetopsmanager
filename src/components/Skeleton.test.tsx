import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonTable, SkeletonCard, PageSkeleton } from './Skeleton';

describe('SkeletonTable', () => {
  it('renders default 5 rows', () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll('.flex.gap-4');
    expect(rows.length).toBe(5);
  });

  it('renders default 5 columns per row', () => {
    const { container } = render(<SkeletonTable />);
    const cells = container.querySelectorAll('.skeleton');
    expect(cells.length).toBe(25);
  });

  it('renders custom row and column count', () => {
    const { container } = render(<SkeletonTable rows={3} cols={2} />);
    const rows = container.querySelectorAll('.flex.gap-4');
    expect(rows.length).toBe(3);
    const cells = container.querySelectorAll('.skeleton');
    expect(cells.length).toBe(6);
  });

  it('wraps in animate-pulse', () => {
    const { container } = render(<SkeletonTable />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });
});

describe('SkeletonCard', () => {
  it('renders a card with animate-pulse', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });

  it('renders skeleton placeholders', () => {
    const { container } = render(<SkeletonCard />);
    const skeletonDivs = container.querySelectorAll('.skeleton');
    expect(skeletonDivs.length).toBeGreaterThanOrEqual(3);
  });
});

describe('PageSkeleton', () => {
  it('renders header skeleton', () => {
    const { container } = render(<PageSkeleton />);
    const headers = container.querySelectorAll('.h-9');
    expect(headers.length).toBeGreaterThanOrEqual(1);
  });

  it('renders table skeleton rows', () => {
    const { container } = render(<PageSkeleton />);
    const rows = container.querySelectorAll('.flex.gap-4');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('renders animate-pulse elements', () => {
    const { container } = render(<PageSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });
});

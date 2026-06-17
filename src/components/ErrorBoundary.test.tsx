import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from 'react';
import ErrorBoundary from './ErrorBoundary';

class Buggy extends Component<{ shouldThrow?: boolean }> {
  render() {
    if (this.props.shouldThrow) {
      throw new Error('Test error');
    }
    return <div>All good</div>;
  }
}

function GoodChild() {
  return <div>Hello world</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Buggy shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('displays the error message text', () => {
    render(
      <ErrorBoundary>
        <Buggy shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('"Try again" button resets the error state and re-renders children', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Buggy shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try again'));
    // After reset, buggy still throws because shouldThrow=true, so we should see error again
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('recovers and renders children when error is fixed then reset', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Buggy shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // Fix the error source first
    rerender(
      <ErrorBoundary>
        <Buggy shouldThrow={false} />
      </ErrorBoundary>
    );
    // Still showing error because state hasn't been reset yet
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // Now reset
    fireEvent.click(screen.getByText('Try again'));
    // Children should now render
    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});

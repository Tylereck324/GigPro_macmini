'use client';

import { Component, ReactNode } from 'react';
import { Button } from '../ui';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onReset?: () => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Section Error Boundary Component
 * A lighter-weight error boundary for individual sections/components.
 * Shows a compact inline error message instead of a full-page error.
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Error in ${this.props.sectionName || 'section'}:`,
      error,
      errorInfo
    );
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface border border-danger/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            {/* Warning Icon */}
            <svg
              className="w-5 h-5 text-danger flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            {/* Error Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-text mb-1">
                {this.props.sectionName
                  ? `Error loading ${this.props.sectionName}`
                  : 'Error loading this section'}
              </h4>
              <p className="text-xs text-textSecondary mb-3">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

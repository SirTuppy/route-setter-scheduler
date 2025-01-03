// components/ErrorBoundary.tsx
"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorCode } from '../errors/types';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private getErrorMessage(error: Error): string {
    if (error.name === 'SchedulerError') {
      switch ((error as any).code as ErrorCode) {
        case 'WALL_NOT_FOUND':
          return 'The selected wall could not be found. Please refresh and try again.';
        case 'SETTER_NOT_FOUND':
          return 'One or more selected setters could not be found. Please refresh and try again.';
        case 'INVALID_DATE':
          return 'The selected date is invalid. Please choose a different date.';
        case 'SCHEDULE_CONFLICT':
          return 'There is a scheduling conflict. Please check the schedule and try again.';
        case 'DATA_FETCH_ERROR':
          return 'Failed to load schedule data. Please refresh the page.';
        case 'DATA_UPDATE_ERROR':
          return 'Failed to update the schedule. Please try again.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">
            {this.getErrorMessage(this.state.error!)}
          </AlertDescription>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}
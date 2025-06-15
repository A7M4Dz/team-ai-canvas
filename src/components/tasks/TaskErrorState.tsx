
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TaskErrorStateProps {
  error?: Error | null;
  onRetry: () => void;
}

export function TaskErrorState({ error, onRetry }: TaskErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tasks</h3>
      <p className="text-red-700 mb-4">
        {error?.message || 'Failed to load tasks'}
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

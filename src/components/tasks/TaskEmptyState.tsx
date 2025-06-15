
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Plus } from 'lucide-react';

interface TaskEmptyStateProps {
  hasFilters: boolean;
}

export function TaskEmptyState({ hasFilters }: TaskEmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="text-gray-500">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="mb-4">
            {hasFilters
              ? 'No tasks match your current filters.'
              : 'Get started by creating your first task.'}
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

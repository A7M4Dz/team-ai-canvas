
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string | null;
  progress: number;
  start_date: string;
  end_date: string;
  estimated_hours: number | null;
  actual_hours: number | null;
  assignee: string | null;
  project_id: string | null;
  color: string;
  created_at: string;
}

interface TaskSummaryCardsProps {
  tasks: Task[];
}

export function TaskSummaryCards({ tasks }: TaskSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {tasks.filter(t => t.status === 'todo').length}
            </div>
            <div className="text-sm text-gray-600">To Do</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

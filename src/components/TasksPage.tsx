
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskGanttChart } from '@/components/tasks/TaskGanttChart';
import { TaskSummaryCards } from '@/components/tasks/TaskSummaryCards';
import { TaskEmptyState } from '@/components/tasks/TaskEmptyState';
import { TaskLoadingState } from '@/components/tasks/TaskLoadingState';
import { TaskErrorState } from '@/components/tasks/TaskErrorState';

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

export function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = async (): Promise<Task[]> => {
    console.log('Fetching tasks, user:', user?.email);
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    console.log('Tasks fetched successfully:', data?.length || 0);
    return data || [];
  };

  const { 
    data: tasks = [], 
    isLoading: tasksLoading, 
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    enabled: !authLoading,
    retry: 1,
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const hasFilters = Boolean(searchTerm) || statusFilter !== 'all' || priorityFilter !== 'all';

  if (authLoading || tasksLoading) {
    return <TaskLoadingState authLoading={authLoading} />;
  }

  if (isError) {
    return <TaskErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks with Gantt chart visualization</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
      />

      {/* Gantt Chart or Empty State */}
      {filteredTasks.length > 0 ? (
        <TaskGanttChart tasks={filteredTasks} />
      ) : (
        <TaskEmptyState hasFilters={hasFilters} />
      )}

      {/* Task Summary */}
      <TaskSummaryCards tasks={filteredTasks} />
    </div>
  );
}

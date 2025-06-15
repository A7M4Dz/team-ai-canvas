
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

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

interface GanttTask extends Task {
  startDay: number;
  duration: number;
}

export function TasksPage() {
  const { userProfile, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = async (): Promise<Task[]> => {
    if (!userProfile || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  };

  const { 
    data: tasks = [], 
    isLoading, 
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['tasks', userProfile?.id],
    queryFn: fetchTasks,
    enabled: !!userProfile && !!user,
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Prepare data for Gantt chart
  const ganttData: GanttTask[] = filteredTasks.map(task => {
    const startDate = parseISO(task.start_date);
    const endDate = parseISO(task.end_date);
    const earliestDate = filteredTasks.length > 0 
      ? parseISO(filteredTasks.reduce((earliest, t) => t.start_date < earliest ? t.start_date : earliest, filteredTasks[0].start_date))
      : startDate;
    
    return {
      ...task,
      startDay: differenceInDays(startDate, earliestDate),
      duration: differenceInDays(endDate, startDate) + 1,
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'review': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#EAB308';
      case 'low': return '#22C55E';
      default: return '#6B7280';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const task = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{task.name}</p>
          <p className="text-sm text-gray-600">{task.description}</p>
          <p className="text-sm">
            <span className="font-medium">Duration:</span> {task.duration} days
          </p>
          <p className="text-sm">
            <span className="font-medium">Progress:</span> {task.progress}%
          </p>
          <p className="text-sm">
            <span className="font-medium">Status:</span> 
            <Badge variant="secondary" className="ml-1">{task.status}</Badge>
          </p>
          {task.assignee && (
            <p className="text-sm">
              <span className="font-medium">Assignee:</span> {task.assignee}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tasks</h3>
        <p className="text-red-700 mb-4">
          {error?.message || 'Failed to load tasks'}
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
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
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      {filteredTasks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Task Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ganttData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="startDay" stackId="timeline" fill="transparent" />
                  <Bar dataKey="duration" stackId="timeline">
                    {ganttData.map((task, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getStatusColor(task.status)}
                        opacity={task.progress / 100}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
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
      )}

      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredTasks.length}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredTasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredTasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {filteredTasks.filter(t => t.status === 'todo').length}
              </div>
              <div className="text-sm text-gray-600">To Do</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

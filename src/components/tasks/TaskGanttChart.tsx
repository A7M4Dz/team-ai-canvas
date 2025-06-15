
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';

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

interface TaskGanttChartProps {
  tasks: Task[];
}

export function TaskGanttChart({ tasks }: TaskGanttChartProps) {
  // Prepare data for Gantt chart
  const ganttData: GanttTask[] = tasks.map(task => {
    const startDate = parseISO(task.start_date);
    const endDate = parseISO(task.end_date);
    const earliestDate = tasks.length > 0 
      ? parseISO(tasks.reduce((earliest, t) => t.start_date < earliest ? t.start_date : earliest, tasks[0].start_date))
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

  return (
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
  );
}

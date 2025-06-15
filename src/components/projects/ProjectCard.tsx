
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FolderOpen } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  start_date: string;
  end_date: string;
  budget: number;
  color: string;
  owner_id: string;
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'planning': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Link to={`/projects/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer border-l-4" style={{ borderLeftColor: project.color || '#3B82F6' }}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}
              />
              <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
            </div>
            <Badge variant={getPriorityColor(project.priority)} className="text-xs">
              {project.priority}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || 'No description available'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No date'}
            </div>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              Team
            </div>
          </div>

          {project.budget > 0 && (
            <div className="text-sm text-gray-600">
              Budget: ${project.budget.toLocaleString()}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <Badge variant="outline" className="text-xs capitalize">
              {project.status.replace('_', ' ')}
            </Badge>
            <Button variant="ghost" size="sm">
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

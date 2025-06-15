
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Edit,
  Plus,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  start_date: string;
  end_date: string;
  assignee: string;
  assignee_id?: string;
  estimated_hours: number;
  actual_hours: number;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      // Map tasks to include default values for missing fields
      const mappedTasks = (tasksData || []).map(task => ({
        ...task,
        assignee_id: task.assignee_id || null
      }));
      
      setTasks(mappedTasks);

      // Fetch team members
      const { data: membersData } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', id);

      const formattedMembers = membersData?.map(member => ({
        id: member.profiles?.id,
        full_name: member.profiles?.full_name,
        email: member.profiles?.email,
        role: member.role,
        avatar_url: member.profiles?.avatar_url
      })) || [];

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'review': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  const actualHours = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <div 
                className={`w-4 h-4 rounded-full ${getStatusColor(project.status)}`}
              />
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant={getPriorityColor(project.priority)}>
                {project.priority}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        {(userRole === 'admin' || userRole === 'manager') && (
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        )}
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold">{project.progress}%</p>
              </div>
              <Progress value={project.progress} className="w-16" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-2xl font-bold">{completedTasks}/{tasks.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget</p>
                <p className="text-2xl font-bold">${project.budget?.toLocaleString() || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Start Date</p>
                    <p className="text-sm">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">End Date</p>
                    <p className="text-sm">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge variant="outline" className="text-xs">
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Priority</p>
                    <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                      {project.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                  <p className="text-sm text-gray-700">{project.description || 'No description available'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Project created</p>
                      <p className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Task "{task.name}" {task.status === 'completed' ? 'completed' : 'updated'}</p>
                        <p className="text-xs text-gray-500">Recently</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Project Tasks</h3>
            {(userRole === 'admin' || userRole === 'manager') && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getTaskStatusIcon(task.status)}
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(task.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {task.estimated_hours || 0}h estimated
                        </span>
                        {task.assignee && (
                          <span>Assigned to {task.assignee}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">{task.progress}%</p>
                        <Progress value={task.progress} className="w-20" />
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500 mb-4">Start by creating your first task for this project</p>
              {(userRole === 'admin' || userRole === 'manager') && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Team Members</h3>
            {(userRole === 'admin' || userRole === 'manager') && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.full_name?.charAt(0) || member.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{member.full_name || 'User'}</h4>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
              <p className="text-gray-500 mb-4">Add team members to start collaborating</p>
              {(userRole === 'admin' || userRole === 'manager') && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Visual timeline of project milestones and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline View</h3>
                <p className="text-gray-500">Timeline visualization will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

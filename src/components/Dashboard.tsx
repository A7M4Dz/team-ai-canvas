
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  totalTasks: number;
  teamMembers: number;
  avgProgress: number;
}

export function Dashboard() {
  const { userRole, userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0,
    teamMembers: 0,
    avgProgress: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects based on user role
      let projectsQuery = supabase.from('projects').select('*');
      
      if (userRole === 'member') {
        // Members only see projects they're assigned to
        projectsQuery = projectsQuery.in('id', 
          await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', userProfile?.id)
            .then(res => res.data?.map(p => p.project_id) || [])
        );
      } else if (userRole === 'manager') {
        // Managers see their own projects + assigned projects
        const assignedProjects = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', userProfile?.id);
        
        const assignedIds = assignedProjects.data?.map(p => p.project_id) || [];
        
        projectsQuery = projectsQuery.or(`owner_id.eq.${userProfile?.id},id.in.(${assignedIds.join(',')})`);
      }
      
      const { data: projects } = await projectsQuery;
      
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .limit(10)
        .order('created_at', { ascending: false });

      // Fetch team members count
      const { count: teamCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate stats
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const avgProgress = projects?.length ? 
        projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length : 0;

      setStats({
        totalProjects: projects?.length || 0,
        activeProjects,
        completedTasks,
        totalTasks: tasks?.length || 0,
        teamMembers: teamCount || 0,
        avgProgress: Math.round(avgProgress)
      });

      setRecentProjects(projects?.slice(0, 5) || []);
      setRecentTasks(tasks?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userProfile?.full_name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'manager') && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalTasks} total tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            <Progress value={stats.avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="mr-2 h-5 w-5" />
              Recent Projects
            </CardTitle>
            <CardDescription>
              Your latest project activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.length > 0 ? recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`}
                    />
                    <h4 className="font-medium text-sm">{project.name}</h4>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                      {project.priority}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {project.progress}% complete
                    </span>
                  </div>
                </div>
                <Progress value={project.progress} className="w-20" />
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No recent projects</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>
              Latest task updates and activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.length > 0 ? recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant={task.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {task.assignee && (
                      <span className="text-xs text-gray-500">
                        • {task.assignee}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {task.progress}%
                  </div>
                  <Progress value={task.progress} className="w-16 mt-1" />
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No recent tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

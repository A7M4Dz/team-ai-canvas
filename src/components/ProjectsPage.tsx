
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Users, 
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { Link } from 'react-router-dom';
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

export function ProjectsPage() {
  const { userRole, userProfile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const fetchProjects = async (): Promise<Project[]> => {
    if (!userProfile || !user) {
      console.log('User not authenticated - missing profile or user');
      throw new Error('User not authenticated');
    }

    console.log('Fetching projects for user:', userProfile.id, 'with role:', userRole);
    console.log('User email:', user.email);

    try {
      let query = supabase.from('projects').select('*');
      
      // The new RLS policies now handle role-based access automatically
      // No need for manual role filtering in the query
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      console.log('Successfully fetched projects:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('Fetch projects error:', err);
      throw err;
    }
  };

  const { 
    data: projects = [], 
    isLoading, 
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['projects', userProfile?.id, userRole],
    queryFn: fetchProjects,
    enabled: !!userProfile && !!user,
    gcTime: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      console.log(`Query retry attempt ${failureCount} for error:`, error);
      // Don't retry on authentication or permission errors
      if (error.message.includes('permission') || error.message.includes('authentication')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const handleProjectCreated = () => {
    console.log('Project created, invalidating queries...');
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    toast({
      title: "Success",
      description: "Project created successfully!",
    });
  };

  const handleRefresh = async () => {
    try {
      console.log('Manual refresh triggered');
      await refetch();
      toast({
        title: "Refreshed",
        description: "Project list updated successfully!",
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh project list. Please try again.",
        variant: "destructive",
      });
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const canCreateProjects = userRole === 'admin' || userRole === 'manager';

  if (isLoading && !isError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your projects ({filteredProjects.length} visible)
          </p>
          {userRole && (
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-500">Role: {userRole}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            variant="outline"
            size="sm"
          >
            {showDebugInfo ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            Debug
          </Button>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canCreateProjects && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="bg-gray-100 border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User ID:</strong> {user?.id || 'Not available'}
            </div>
            <div>
              <strong>User Email:</strong> {user?.email || 'Not available'}
            </div>
            <div>
              <strong>User Role:</strong> {userRole || 'Not set'}
            </div>
            <div>
              <strong>Total Projects:</strong> {projects.length}
            </div>
            <div>
              <strong>Query Status:</strong> {isLoading ? 'Loading' : isError ? 'Error' : 'Success'}
            </div>
            <div>
              <strong>Can Create:</strong> {canCreateProjects ? 'Yes' : 'No'}
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-sm">
              <strong>Error:</strong> {error.message}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {isError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <div className="flex">
            <div className="py-1"><AlertCircle className="h-6 w-6 text-red-500 mr-4" /></div>
            <div>
              <p className="font-bold">Error Loading Projects</p>
              <p className="text-sm">
                There was a problem fetching your projects: "{error?.message}".
                <br />
                Please try refreshing or contact support if the issue persists.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {!isError && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
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
          ))}
        </div>
      ) : !isError && (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'
            }
          </p>
          {canCreateProjects && !searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

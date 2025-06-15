
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateProjectModal } from './CreateProjectModal';
import { useToast } from '@/hooks/use-toast';
import { ProjectsHeader } from './projects/ProjectsHeader';
import { ProjectFilters } from './projects/ProjectFilters';
import { ProjectDebugInfo } from './projects/ProjectDebugInfo';
import { ProjectsError } from './projects/ProjectsError';
import { ProjectsLoading } from './projects/ProjectsLoading';
import { ProjectCard } from './projects/ProjectCard';
import { ProjectsEmptyState } from './projects/ProjectsEmptyState';

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
      // The new RLS policies now handle role-based access automatically
      // No need for manual role filtering in the query
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const canCreateProjects = userRole === 'admin' || userRole === 'manager';

  if (isLoading && !isError) {
    return <ProjectsLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProjectsHeader
        filteredProjectsCount={filteredProjects.length}
        userRole={userRole}
        showDebugInfo={showDebugInfo}
        setShowDebugInfo={setShowDebugInfo}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
        canCreateProjects={canCreateProjects}
        setShowCreateModal={setShowCreateModal}
      />

      {/* Debug Information */}
      {showDebugInfo && (
        <ProjectDebugInfo
          user={user}
          userRole={userRole}
          projects={projects}
          isLoading={isLoading}
          isError={isError}
          error={error}
          canCreateProjects={canCreateProjects}
        />
      )}

      {/* Error Display */}
      {isError && <ProjectsError error={error} />}

      {/* Filters */}
      <ProjectFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />

      {/* Projects Grid */}
      {!isError && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : !isError && (
        <ProjectsEmptyState
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          canCreateProjects={canCreateProjects}
          setShowCreateModal={setShowCreateModal}
        />
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

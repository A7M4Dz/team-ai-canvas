
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';

interface ProjectsEmptyStateProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  canCreateProjects: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export function ProjectsEmptyState({
  searchTerm,
  statusFilter,
  priorityFilter,
  canCreateProjects,
  setShowCreateModal
}: ProjectsEmptyStateProps) {
  return (
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
  );
}

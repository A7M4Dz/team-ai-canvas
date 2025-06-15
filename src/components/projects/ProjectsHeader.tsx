
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Shield, Eye, EyeOff } from 'lucide-react';

interface ProjectsHeaderProps {
  filteredProjectsCount: number;
  userRole: string | null;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
  handleRefresh: () => void;
  isLoading: boolean;
  canCreateProjects: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export function ProjectsHeader({
  filteredProjectsCount,
  userRole,
  showDebugInfo,
  setShowDebugInfo,
  handleRefresh,
  isLoading,
  canCreateProjects,
  setShowCreateModal
}: ProjectsHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-1">
          Manage and track all your projects ({filteredProjectsCount} visible)
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
  );
}

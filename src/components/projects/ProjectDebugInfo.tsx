
import React from 'react';

interface ProjectDebugInfoProps {
  user: any;
  userRole: string | null;
  projects: any[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  canCreateProjects: boolean;
}

export function ProjectDebugInfo({
  user,
  userRole,
  projects,
  isLoading,
  isError,
  error,
  canCreateProjects
}: ProjectDebugInfoProps) {
  return (
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
  );
}

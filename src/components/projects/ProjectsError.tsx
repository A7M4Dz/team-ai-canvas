
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ProjectsErrorProps {
  error: any;
}

export function ProjectsError({ error }: ProjectsErrorProps) {
  return (
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
  );
}

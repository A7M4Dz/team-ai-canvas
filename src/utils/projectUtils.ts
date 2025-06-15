
import { supabase } from '@/integrations/supabase/client';

export interface ProjectValidationError {
  field: string;
  message: string;
}

export class ProjectSecurityService {
  static async validateProjectAccess(projectId: string, userId: string, requiredAction: 'read' | 'write' | 'delete'): Promise<boolean> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      if (error || !project) {
        console.error('Project access validation failed:', error);
        return false;
      }

      // Check if user is owner
      if (project.owner_id === userId) {
        return true;
      }

      // Check if user is a member for read access
      if (requiredAction === 'read') {
        const { data: membership } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', userId)
          .single();

        return !!membership;
      }

      return false;
    } catch (error) {
      console.error('Project security validation error:', error);
      return false;
    }
  }

  static validateProjectData(projectData: any): ProjectValidationError[] {
    const errors: ProjectValidationError[] = [];

    if (!projectData.name || projectData.name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Project name must be at least 3 characters long' });
    }

    if (projectData.name && projectData.name.length > 100) {
      errors.push({ field: 'name', message: 'Project name cannot exceed 100 characters' });
    }

    if (projectData.description && projectData.description.length > 500) {
      errors.push({ field: 'description', message: 'Description cannot exceed 500 characters' });
    }

    if (projectData.budget && (isNaN(projectData.budget) || projectData.budget < 0)) {
      errors.push({ field: 'budget', message: 'Budget must be a positive number' });
    }

    if (projectData.progress && (projectData.progress < 0 || projectData.progress > 100)) {
      errors.push({ field: 'progress', message: 'Progress must be between 0 and 100' });
    }

    if (projectData.start_date && projectData.end_date) {
      const startDate = new Date(projectData.start_date);
      const endDate = new Date(projectData.end_date);
      
      if (endDate < startDate) {
        errors.push({ field: 'end_date', message: 'End date must be after start date' });
      }
    }

    return errors;
  }

  static sanitizeProjectData(projectData: any) {
    return {
      name: projectData.name?.trim() || '',
      description: projectData.description?.trim() || '',
      status: ['planning', 'active', 'on_hold', 'completed'].includes(projectData.status) 
        ? projectData.status 
        : 'planning',
      priority: ['low', 'medium', 'high', 'urgent'].includes(projectData.priority) 
        ? projectData.priority 
        : 'medium',
      progress: Math.max(0, Math.min(100, parseInt(projectData.progress) || 0)),
      budget: projectData.budget ? Math.max(0, parseFloat(projectData.budget)) : null,
      start_date: projectData.start_date || null,
      end_date: projectData.end_date || null,
      color: projectData.color?.match(/^#[0-9A-F]{6}$/i) ? projectData.color : '#3B82F6'
    };
  }
}

export const getProjectStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return '✅';
    case 'active': return '🚀';
    case 'on_hold': return '⏸️';
    case 'planning': return '📋';
    default: return '📁';
  }
};

export const formatProjectBudget = (budget: number): string => {
  if (budget >= 1000000) {
    return `$${(budget / 1000000).toFixed(1)}M`;
  } else if (budget >= 1000) {
    return `$${(budget / 1000).toFixed(0)}K`;
  }
  return `$${budget.toLocaleString()}`;
};

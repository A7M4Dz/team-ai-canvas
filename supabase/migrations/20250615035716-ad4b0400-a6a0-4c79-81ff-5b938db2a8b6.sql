
-- Drop existing problematic RLS policies for projects
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update their projects" ON public.projects;

-- Create a security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new RLS policies for projects using the security definer function
CREATE POLICY "Users can view projects based on role" ON public.projects
FOR SELECT USING (
  CASE 
    WHEN public.get_current_user_role() = 'admin' THEN true
    WHEN public.get_current_user_role() = 'manager' THEN (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
    WHEN public.get_current_user_role() = 'member' THEN (
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
    ELSE false
  END
);

CREATE POLICY "Managers and admins can create projects" ON public.projects
FOR INSERT WITH CHECK (
  public.get_current_user_role() IN ('admin', 'manager') AND
  owner_id = auth.uid()
);

CREATE POLICY "Project owners and admins can update projects" ON public.projects
FOR UPDATE USING (
  owner_id = auth.uid() OR 
  public.get_current_user_role() = 'admin'
);

CREATE POLICY "Project owners and admins can delete projects" ON public.projects
FOR DELETE USING (
  owner_id = auth.uid() OR 
  public.get_current_user_role() = 'admin'
);

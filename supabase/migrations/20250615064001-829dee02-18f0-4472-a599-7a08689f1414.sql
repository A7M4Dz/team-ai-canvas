
-- First, let's completely clean up and recreate the RLS policies with a better approach
DROP POLICY IF EXISTS "Users can view projects based on role" ON public.projects;
DROP POLICY IF EXISTS "Managers and admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners and admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners and admins can delete projects" ON public.projects;

-- Drop and recreate the function to ensure it's clean
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create a more robust security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'member');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simplified, non-recursive RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.projects
FOR SELECT 
TO authenticated
USING (
  CASE public.get_current_user_role()
    WHEN 'admin' THEN true
    WHEN 'manager' THEN (
      owner_id = auth.uid() OR 
      id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
    )
    ELSE id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  END
);

CREATE POLICY "Enable insert for managers and admins" ON public.projects
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'manager') AND
  owner_id = auth.uid()
);

CREATE POLICY "Enable update for project owners and admins" ON public.projects
FOR UPDATE 
TO authenticated
USING (
  owner_id = auth.uid() OR 
  public.get_current_user_role() = 'admin'
);

CREATE POLICY "Enable delete for project owners and admins" ON public.projects
FOR DELETE 
TO authenticated
USING (
  owner_id = auth.uid() OR 
  public.get_current_user_role() = 'admin'
);

-- Also ensure project_members has proper RLS policies
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Users can manage project members" ON public.project_members;

CREATE POLICY "Enable read access for project members" ON public.project_members
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  public.get_current_user_role() = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

CREATE POLICY "Enable insert for project owners and admins" ON public.project_members
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

CREATE POLICY "Enable update for project owners and admins" ON public.project_members
FOR UPDATE 
TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

CREATE POLICY "Enable delete for project owners and admins" ON public.project_members
FOR DELETE 
TO authenticated
USING (
  public.get_current_user_role() = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

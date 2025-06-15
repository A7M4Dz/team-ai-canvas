
-- First, drop all policies that depend on the get_current_user_role function
DROP POLICY IF EXISTS "Enable read access for project members" ON public.project_members;
DROP POLICY IF EXISTS "Enable insert for project owners and admins" ON public.project_members;
DROP POLICY IF EXISTS "Enable update for project owners and admins" ON public.project_members;
DROP POLICY IF EXISTS "Enable delete for project owners and admins" ON public.project_members;

-- Now drop all project policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for managers and admins" ON public.projects;
DROP POLICY IF EXISTS "Enable update for project owners and admins" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for project owners and admins" ON public.projects;

-- Drop any remaining old policies
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects based on role" ON public.projects;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create a simple, non-recursive function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE id = user_uuid 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simple, direct policies for projects without any recursive references
CREATE POLICY "projects_select_policy" ON public.projects
FOR SELECT 
TO authenticated
USING (
  -- Admin can see all
  public.get_user_role(auth.uid()) = 'admin' OR
  -- Project owner can see their projects
  owner_id = auth.uid() OR
  -- Project members can see assigned projects
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = projects.id AND user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert_policy" ON public.projects
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'manager') AND
  owner_id = auth.uid()
);

CREATE POLICY "projects_update_policy" ON public.projects
FOR UPDATE 
TO authenticated
USING (
  owner_id = auth.uid() OR 
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "projects_delete_policy" ON public.projects
FOR DELETE 
TO authenticated
USING (
  owner_id = auth.uid() OR 
  public.get_user_role(auth.uid()) = 'admin'
);

-- Recreate policies for project_members table
CREATE POLICY "project_members_select_policy" ON public.project_members
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  public.get_user_role(auth.uid()) = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

CREATE POLICY "project_members_insert_policy" ON public.project_members
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

CREATE POLICY "project_members_update_policy" ON public.project_members
FOR UPDATE 
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

CREATE POLICY "project_members_delete_policy" ON public.project_members
FOR DELETE 
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'admin' OR
  project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
);

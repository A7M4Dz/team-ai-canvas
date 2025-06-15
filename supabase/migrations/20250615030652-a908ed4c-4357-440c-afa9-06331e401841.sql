
-- First, let's modify the existing tables to fit the ProjectAI needs

-- Update the profiles table to include roles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the tasks table to better fit project management needs
ALTER TABLE public.tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_hours INTEGER;

-- Create a projects table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  color TEXT DEFAULT '#3B82F6'
);

-- Create project_members table for team assignments
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('manager', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Add foreign key constraints
ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.project_members ADD CONSTRAINT fk_project_members_project_id 
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_members ADD CONSTRAINT fk_project_members_user_id 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for projects
CREATE POLICY "Admins can view all projects" ON public.projects FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Managers can view their projects" ON public.projects FOR SELECT USING (
  owner_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

CREATE POLICY "Members can view assigned projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

CREATE POLICY "Managers can create projects" ON public.projects FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'manager') AND
  owner_id = auth.uid()
);

CREATE POLICY "Project owners can update their projects" ON public.projects FOR UPDATE USING (
  owner_id = auth.uid() OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Create RLS policies for project_members
CREATE POLICY "Users can view project members of their projects" ON public.project_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    owner_id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )) OR user_id = auth.uid()
);

CREATE POLICY "Project owners can manage members" ON public.project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    owner_id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  ))
);

-- Create RLS policies for tasks
CREATE POLICY "Users can view relevant tasks" ON public.tasks FOR SELECT USING (
  user_id = auth.uid() OR
  assignee = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid())
);

CREATE POLICY "Users can create tasks in their projects" ON public.tasks FOR INSERT WITH CHECK (
  project_id IS NULL OR
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (
    owner_id = auth.uid() OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )) OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their tasks" ON public.tasks FOR UPDATE USING (
  user_id = auth.uid() OR
  assignee = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Update the handle_new_user function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'member'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at on projects
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_updated_at ON public.projects;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

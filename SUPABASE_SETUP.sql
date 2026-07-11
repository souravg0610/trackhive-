-- Run this ENTIRE block in Supabase SQL Editor (fresh start)
-- https://supabase.com/dashboard/project/vgycnidftvfvzemkpdvl/sql/new

DROP TABLE IF EXISTS public.salary_configs CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.routes CASCADE;
DROP TABLE IF EXISTS public.tracking_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.geofences CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.visits CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  industry TEXT,
  company_size TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL,
  full_name TEXT,
  role TEXT DEFAULT 'Super Administrator',
  department TEXT DEFAULT 'Operations',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.employees (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Field Agent',
  job_title TEXT DEFAULT '',
  department TEXT NOT NULL DEFAULT 'Operations',
  status TEXT NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_working_day TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  auth_user_id UUID,
  joining_date TEXT DEFAULT '',
  reporting_manager TEXT DEFAULT '',
  work_location TEXT DEFAULT '',
  address TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  marital_status TEXT DEFAULT 'Single',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.salary_configs (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  ctc_monthly NUMERIC NOT NULL DEFAULT 30000,
  opt_in_epf BOOLEAN DEFAULT true,
  metro_hra BOOLEAN DEFAULT true,
  custom_tds NUMERIC DEFAULT 0,
  mediclaim_deduction NUMERIC DEFAULT 1250,
  custom_allowance NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.attendance (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id TEXT DEFAULT '',
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  check_in_time TEXT DEFAULT '',
  check_out_time TEXT DEFAULT '',
  working_hours TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Present',
  location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  selfie_url TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.visits (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  industry TEXT DEFAULT '',
  employee_id TEXT DEFAULT '',
  employee_name TEXT NOT NULL DEFAULT '',
  visit_type TEXT NOT NULL DEFAULT 'Client Meeting',
  location TEXT DEFAULT '',
  check_in_time TEXT DEFAULT '',
  check_out_time TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT DEFAULT '',
  documents JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT DEFAULT '',
  employee_id TEXT DEFAULT '',
  employee_name TEXT NOT NULL DEFAULT '',
  due_date TEXT DEFAULT '',
  due_time TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  description TEXT DEFAULT '',
  subtasks JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  selfie_proof TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.geofences (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT DEFAULT '',
  radius INT NOT NULL DEFAULT 250,
  employees_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_on TEXT DEFAULT '',
  last_updated TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.documents (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  uploaded_by TEXT NOT NULL DEFAULT '',
  uploaded_by_id TEXT DEFAULT '',
  uploaded_date TEXT DEFAULT '',
  size TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  id_number TEXT DEFAULT '',
  dob TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  employee_name TEXT DEFAULT '',
  employee_role TEXT DEFAULT '',
  location TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'System',
  priority TEXT NOT NULL DEFAULT 'Low',
  time TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  avatar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX ON public.employees(company_id);
CREATE INDEX ON public.employees(is_active);
CREATE INDEX ON public.salary_configs(company_id, employee_id);
CREATE INDEX ON public.attendance(company_id);
CREATE INDEX ON public.visits(company_id);
CREATE INDEX ON public.tasks(company_id);
CREATE INDEX ON public.geofences(company_id);
CREATE INDEX ON public.documents(company_id);
CREATE INDEX ON public.notifications(company_id);

-- Row Level Security
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Company
CREATE POLICY "company_insert" ON public.company_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "company_member_select" ON public.company_profiles FOR SELECT USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "company_member_update" ON public.company_profiles FOR UPDATE USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Data tables scoped to company
CREATE POLICY "emp_company" ON public.employees FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "sal_company" ON public.salary_configs FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "att_company" ON public.attendance FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "vis_company" ON public.visits FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "tsk_company" ON public.tasks FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "geo_company" ON public.geofences FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "doc_company" ON public.documents FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "notif_company" ON public.notifications FOR ALL USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

SELECT 'Schema ready.' AS status;
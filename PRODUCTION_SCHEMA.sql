-- =====================================================================
-- TRACKHIVE — PRODUCTION DATABASE SCHEMA v2.1
-- Unified schema that serves BOTH the new v2.0 tables AND the
-- compatibility views the app code queries (profiles, company_profiles,
-- org_settings, salary_configs).
--
-- Run this ENTIRE file once in Supabase SQL Editor.
-- Project: vgycnidftvfvzemkpdvl
-- =====================================================================

-- ── Extensions ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Drop legacy tables and views safely ──────────────────────────────
DROP VIEW  IF EXISTS public.profiles         CASCADE;
DROP VIEW  IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.org_settings     CASCADE;
DROP TABLE IF EXISTS public.salary_configs   CASCADE;
DROP TABLE IF EXISTS public.payslips         CASCADE;
DROP TABLE IF EXISTS public.salary_structures CASCADE;
DROP TABLE IF EXISTS public.shift_assignments CASCADE;
DROP TABLE IF EXISTS public.shifts           CASCADE;
DROP TABLE IF EXISTS public.leaves           CASCADE;
DROP TABLE IF EXISTS public.leave_balances   CASCADE;
DROP TABLE IF EXISTS public.leave_types      CASCADE;
DROP TABLE IF EXISTS public.reports          CASCADE;
DROP TABLE IF EXISTS public.documents        CASCADE;
DROP TABLE IF EXISTS public.notifications    CASCADE;
DROP TABLE IF EXISTS public.tasks            CASCADE;
DROP TABLE IF EXISTS public.visits           CASCADE;
DROP TABLE IF EXISTS public.geofences        CASCADE;
DROP TABLE IF EXISTS public.employee_locations CASCADE;
DROP TABLE IF EXISTS public.attendance       CASCADE;
DROP TABLE IF EXISTS public.employees        CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.modules          CASCADE;
DROP TABLE IF EXISTS public.roles            CASCADE;
DROP TABLE IF EXISTS public.users            CASCADE;
DROP TABLE IF EXISTS public.subscriptions    CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.companies        CASCADE;

-- =====================================================================
-- 1. COMPANIES (TENANTS)
-- =====================================================================
CREATE TABLE public.companies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT        NOT NULL,
  company_code    TEXT        UNIQUE,
  email           TEXT,
  phone           TEXT,
  logo            TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT        DEFAULT 'India',
  pincode         TEXT,
  gstin           TEXT,
  industry        TEXT,
  company_size    TEXT,
  plan            TEXT        DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  max_employees   INTEGER     DEFAULT 10,
  status          TEXT        DEFAULT 'active',
  timezone        TEXT        DEFAULT 'Asia/Kolkata',
  currency        TEXT        DEFAULT 'INR',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 2. USERS (linked to auth.users)
-- =====================================================================
CREATE TABLE public.users (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name       TEXT        NOT NULL,
  email           TEXT        UNIQUE,
  phone           TEXT,
  role            TEXT        DEFAULT 'Field Agent',
  department      TEXT        DEFAULT 'Operations',
  status          TEXT        DEFAULT 'active',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 3. ROLES
-- =====================================================================
CREATE TABLE public.roles (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID  REFERENCES public.companies(id) ON DELETE CASCADE,
  role_name   TEXT  NOT NULL,
  description TEXT,
  is_default  BOOLEAN DEFAULT false,
  is_admin    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 4. MODULES (feature registry)
-- =====================================================================
CREATE TABLE public.modules (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key  TEXT  UNIQUE NOT NULL,
  module_name TEXT  NOT NULL,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0
);

INSERT INTO public.modules (module_key, module_name, icon, sort_order) VALUES
  ('dashboard',     'Dashboard',      'LayoutDashboard', 1),
  ('employees',     'Employees',      'Users',           2),
  ('attendance',    'Attendance',     'Calendar',        3),
  ('tracking',      'Live Tracking',  'MapPin',          4),
  ('shifts',        'Shift Roster',   'Clock',           5),
  ('payroll',       'Payroll',        'Banknote',        6),
  ('leaves',        'Leave Manager',  'Plane',           7),
  ('visits',        'Client Visits',  'Building2',       8),
  ('tasks',         'Tasks',          'CheckSquare',     9),
  ('routes',        'Routes',         'Navigation',      10),
  ('geofence',      'Geofences',      'Shield',          11),
  ('reports',       'Reports',        'BarChart2',       12),
  ('documents',     'Documents',      'FileText',        13),
  ('notifications', 'Notifications',  'Bell',            14),
  ('settings',      'Settings',       'Settings',        15)
ON CONFLICT (module_key) DO NOTHING;

-- =====================================================================
-- 5. ROLE PERMISSIONS
-- =====================================================================
CREATE TABLE public.role_permissions (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id     UUID    REFERENCES public.roles(id) ON DELETE CASCADE,
  module_id   UUID    REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view    BOOLEAN DEFAULT false,
  can_create  BOOLEAN DEFAULT false,
  can_edit    BOOLEAN DEFAULT false,
  can_delete  BOOLEAN DEFAULT false,
  can_export  BOOLEAN DEFAULT false,
  UNIQUE(role_id, module_id)
);

-- =====================================================================
-- 6. ORG SETTINGS (JSON blob — fast read for permission map)
-- This is what the app's saveOrgSettings() / loadOrgSettings() uses.
-- The role_permissions table above is the authoritative relational store;
-- org_settings is the denormalised cache the React app reads.
-- =====================================================================
CREATE TABLE public.org_settings (
  company_id          UUID    PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  role_permissions    JSONB   DEFAULT '{}',
  custom_roles        JSONB   DEFAULT '[]',
  custom_departments  JSONB   DEFAULT '[]',
  custom_branches     JSONB   DEFAULT '[]',
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 7. EMPLOYEES
-- =====================================================================
CREATE TABLE public.employees (
  id                 TEXT        PRIMARY KEY,
  company_id         UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id            UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  name               TEXT        NOT NULL,
  role               TEXT        NOT NULL DEFAULT 'Field Agent',
  job_title          TEXT        DEFAULT '',
  department         TEXT        NOT NULL DEFAULT 'Operations',
  branch             TEXT        DEFAULT '',
  manager_id         TEXT,
  status             TEXT        NOT NULL DEFAULT 'active',
  is_active          BOOLEAN     NOT NULL DEFAULT true,
  last_working_day   TEXT        DEFAULT '',
  phone              TEXT        DEFAULT '',
  email              TEXT        DEFAULT '',
  auth_user_id       UUID,
  joining_date       TEXT        DEFAULT '',
  reporting_manager  TEXT        DEFAULT '',
  work_location      TEXT        DEFAULT '',
  address            TEXT        DEFAULT '',
  avatar             TEXT        DEFAULT '',
  marital_status     TEXT        DEFAULT 'Single',
  pan_number         TEXT        DEFAULT '',
  aadhar_number      TEXT        DEFAULT '',
  bank_account       TEXT        DEFAULT '',
  bank_ifsc          TEXT        DEFAULT '',
  emergency_contact  TEXT        DEFAULT '',
  created_by         TEXT        DEFAULT '',
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 8. ATTENDANCE
-- =====================================================================
CREATE TABLE public.attendance (
  id                   TEXT        PRIMARY KEY,
  company_id           UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id          TEXT        DEFAULT '',
  employee_name        TEXT        NOT NULL,
  department           TEXT        NOT NULL DEFAULT '',
  date                 TEXT        NOT NULL,
  check_in_time        TEXT        DEFAULT '',
  check_out_time       TEXT        DEFAULT '',
  working_hours        TEXT        DEFAULT '',
  status               TEXT        NOT NULL DEFAULT 'Present',
  location             TEXT        DEFAULT '',
  notes                TEXT        DEFAULT '',
  selfie_url           TEXT        DEFAULT '',
  punch_in_location    JSONB,
  punch_out_location   JSONB,
  is_regularized       BOOLEAN     DEFAULT false,
  regularized_by       UUID        REFERENCES public.users(id),
  created_by           TEXT        DEFAULT '',
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, employee_id, date)
);

-- =====================================================================
-- 9. EMPLOYEE LOCATIONS (GPS tracking)
-- =====================================================================
CREATE TABLE public.employee_locations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id TEXT        NOT NULL,
  latitude    DECIMAL(10,8) NOT NULL,
  longitude   DECIMAL(11,8) NOT NULL,
  accuracy    DECIMAL,
  speed       DECIMAL,
  heading     DECIMAL,
  altitude    DECIMAL,
  battery     INTEGER,
  is_moving   BOOLEAN     DEFAULT false,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_employee_time
  ON public.employee_locations(employee_id, created_at DESC);

-- =====================================================================
-- 10. GEOFENCES
-- =====================================================================
CREATE TABLE public.geofences (
  id              TEXT        PRIMARY KEY,
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  location        TEXT        DEFAULT '',
  radius          INTEGER     NOT NULL DEFAULT 200,
  employees_count INTEGER     DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'Active',
  created_on      TEXT        DEFAULT '',
  last_updated    TEXT        DEFAULT '',
  created_by      TEXT        DEFAULT '',
  lat             DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng             DOUBLE PRECISION NOT NULL DEFAULT 0,
  alert_on_enter  BOOLEAN     DEFAULT true,
  alert_on_exit   BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 11. SHIFTS
-- =====================================================================
CREATE TABLE public.shifts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shift_name   TEXT        NOT NULL,
  start_time   TEXT        NOT NULL,
  end_time     TEXT        NOT NULL,
  location     TEXT        DEFAULT '',
  zone         TEXT        DEFAULT '',
  shift_type   TEXT        DEFAULT 'general',
  status       TEXT        DEFAULT 'upcoming',
  grace_minutes INTEGER    DEFAULT 15,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.shift_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shift_id      UUID        REFERENCES public.shifts(id) ON DELETE CASCADE,
  employee_id   TEXT        NOT NULL,
  assigned_date DATE        DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shift_id, employee_id, assigned_date)
);

-- =====================================================================
-- 12. LEAVE MANAGEMENT
-- =====================================================================
CREATE TABLE public.leave_types (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type_name    TEXT        NOT NULL,
  code         TEXT        NOT NULL,
  total_days   INTEGER     DEFAULT 12,
  carry_forward BOOLEAN    DEFAULT false,
  is_active    BOOLEAN     DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE public.leave_balances (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id     TEXT        NOT NULL,
  leave_type_id   UUID        REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year            INTEGER     DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  total_days      INTEGER     DEFAULT 0,
  used_days       DECIMAL     DEFAULT 0,
  remaining_days  DECIMAL     GENERATED ALWAYS AS (total_days - used_days) STORED,
  UNIQUE(employee_id, leave_type_id, year)
);

-- leaves table kept with text IDs to match app's string IDs
CREATE TABLE public.leaves (
  id                TEXT        PRIMARY KEY,
  company_id        UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id       TEXT        NOT NULL,
  employee_name     TEXT        NOT NULL DEFAULT '',
  employee_email    TEXT        DEFAULT '',
  leave_type_id     UUID        REFERENCES public.leave_types(id),
  leave_policy_id   TEXT        DEFAULT '',
  leave_policy_name TEXT        DEFAULT '',
  start_date        TEXT        NOT NULL,
  end_date          TEXT        NOT NULL,
  total_days        DECIMAL     DEFAULT 1,
  is_half_day       BOOLEAN     DEFAULT false,
  reason            TEXT        DEFAULT '',
  contact_phone     TEXT        DEFAULT '',
  status            TEXT        DEFAULT 'pending',
  approved_by       TEXT        DEFAULT '',
  applied_on        TEXT        DEFAULT '',
  rejection_reason  TEXT        DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 13. SALARY CONFIGS (app uses salary_configs — not salary_structures)
-- =====================================================================
CREATE TABLE public.salary_configs (
  id                    TEXT        PRIMARY KEY,
  company_id            UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id           TEXT        NOT NULL,
  ctc_monthly           NUMERIC     NOT NULL DEFAULT 30000,
  opt_in_epf            BOOLEAN     DEFAULT true,
  metro_hra             BOOLEAN     DEFAULT true,
  custom_tds            NUMERIC     DEFAULT 0,
  mediclaim_deduction   NUMERIC     DEFAULT 1250,
  custom_allowance      NUMERIC     DEFAULT 0,
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, employee_id)
);

-- =====================================================================
-- 14. PAYSLIPS
-- =====================================================================
CREATE TABLE public.payslips (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id     TEXT        NOT NULL,
  month           INTEGER     NOT NULL,
  year            INTEGER     NOT NULL,
  pay_date        DATE,
  working_days    INTEGER     DEFAULT 26,
  present_days    INTEGER     DEFAULT 0,
  gross_earnings  DECIMAL     DEFAULT 0,
  total_deductions DECIMAL    DEFAULT 0,
  net_pay         DECIMAL     DEFAULT 0,
  earnings_json   JSONB,
  deductions_json JSONB,
  status          TEXT        DEFAULT 'draft',
  generated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, employee_id, month, year)
);

-- =====================================================================
-- 15. VISITS
-- =====================================================================
CREATE TABLE public.visits (
  id              TEXT        PRIMARY KEY,
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id     TEXT        DEFAULT '',
  employee_name   TEXT        NOT NULL DEFAULT '',
  client_name     TEXT        NOT NULL,
  industry        TEXT        DEFAULT '',
  visit_type      TEXT        NOT NULL DEFAULT 'Client Meeting',
  location        TEXT        DEFAULT '',
  check_in_time   TEXT        DEFAULT '',
  check_out_time  TEXT        DEFAULT '',
  duration        TEXT        DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'Pending',
  notes           TEXT        DEFAULT '',
  documents       JSONB       DEFAULT '[]',
  images          JSONB       DEFAULT '[]',
  created_by      TEXT        DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 16. TASKS
-- =====================================================================
CREATE TABLE public.tasks (
  id              TEXT        PRIMARY KEY,
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  client_name     TEXT        DEFAULT '',
  employee_id     TEXT        DEFAULT '',
  employee_name   TEXT        NOT NULL DEFAULT '',
  assigned_by     UUID        REFERENCES public.users(id),
  due_date        TEXT        DEFAULT '',
  due_time        TEXT        DEFAULT '',
  priority        TEXT        NOT NULL DEFAULT 'Medium',
  status          TEXT        NOT NULL DEFAULT 'Pending',
  progress        INTEGER     DEFAULT 0,
  description     TEXT        DEFAULT '',
  subtasks        JSONB       DEFAULT '[]',
  attachments     JSONB       DEFAULT '[]',
  selfie_proof    TEXT        DEFAULT '',
  completed_at    TIMESTAMPTZ,
  created_by      TEXT        DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 17. DOCUMENTS
-- =====================================================================
CREATE TABLE public.documents (
  id              TEXT        PRIMARY KEY,
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  category        TEXT        NOT NULL DEFAULT 'Other',
  uploaded_by     TEXT        NOT NULL DEFAULT '',
  uploaded_by_id  TEXT        DEFAULT '',
  uploaded_date   TEXT        DEFAULT '',
  size            TEXT        DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'Active',
  id_number       TEXT        DEFAULT '',
  dob             TEXT        DEFAULT '',
  gender          TEXT        DEFAULT '',
  tags            JSONB       DEFAULT '[]',
  file_url        TEXT        DEFAULT '',
  is_public       BOOLEAN     DEFAULT false,
  employee_id     TEXT        DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 18. NOTIFICATIONS
-- =====================================================================
CREATE TABLE public.notifications (
  id              TEXT        PRIMARY KEY,
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  employee_name   TEXT        DEFAULT '',
  employee_role   TEXT        DEFAULT '',
  location        TEXT        DEFAULT '',
  type            TEXT        NOT NULL DEFAULT 'System',
  priority        TEXT        NOT NULL DEFAULT 'Low',
  time            TEXT        DEFAULT '',
  read            BOOLEAN     DEFAULT false,
  avatar          TEXT        DEFAULT '',
  reference_id    TEXT,
  reference_type  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 19. REPORTS
-- =====================================================================
CREATE TABLE public.reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by  UUID        REFERENCES public.users(id),
  report_name TEXT        NOT NULL,
  report_type TEXT,
  filters     JSONB,
  data        JSONB,
  file_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 20. COMPANY SETTINGS (key-value)
-- =====================================================================
CREATE TABLE public.company_settings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  setting_key   TEXT        NOT NULL,
  setting_value JSONB,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, setting_key)
);

-- =====================================================================
-- 21. AUDIT LOGS
-- =====================================================================
CREATE TABLE public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES public.users(id),
  action      TEXT        NOT NULL,
  table_name  TEXT,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 22. SUBSCRIPTIONS
-- =====================================================================
CREATE TABLE public.subscriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  plan            TEXT        NOT NULL DEFAULT 'free',
  status          TEXT        DEFAULT 'active',
  max_employees   INTEGER     DEFAULT 10,
  billing_cycle   TEXT        DEFAULT 'monthly',
  amount          DECIMAL     DEFAULT 0,
  currency        TEXT        DEFAULT 'INR',
  started_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  stripe_sub_id   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 23. COMPATIBILITY VIEWS
-- The app code queries 'profiles' and 'company_profiles' (old names).
-- These views make those queries work without changing any app code.
-- =====================================================================
CREATE OR REPLACE VIEW public.profiles AS
  SELECT
    id,
    company_id,
    full_name,
    role,
    department,
    created_at
  FROM public.users;

CREATE OR REPLACE VIEW public.company_profiles AS
  SELECT
    id,
    company_name AS name,
    email,
    phone,
    industry,
    company_size,
    address,
    created_at
  FROM public.companies;

-- =====================================================================
-- 24. PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_employees_company_active ON public.employees(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_company_date  ON public.attendance(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_company_date      ON public.visits(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_company_status     ON public.tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_employee           ON public.tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company    ON public.notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaves_company_status    ON public.leaves(company_id, status);
CREATE INDEX IF NOT EXISTS idx_leaves_employee          ON public.leaves(employee_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_locations_company        ON public.employee_locations(company_id, employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salary_employee          ON public.salary_configs(company_id, employee_id);

-- =====================================================================
-- 25. HELPER FUNCTIONS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_module TEXT)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_settings os,
      jsonb_each(os.role_permissions) AS rp(role_name, perms)
    WHERE os.company_id = public.my_company_id()
      AND rp.role_name = (SELECT role FROM public.users WHERE id = auth.uid())
      AND rp.perms ? p_module
  )
$$;

-- =====================================================================
-- 26. UPDATED_AT AUTO-TRIGGER
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','users','employees','attendance',
    'leaves','visits','tasks','subscriptions'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON public.%s
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t, t, t
    );
  END LOOP;
END $$;

-- =====================================================================
-- 27. NEW COMPANY BOOTSTRAP FUNCTION
-- Call after inserting a new company: SELECT setup_new_company(...)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.setup_new_company(
  p_company_id  UUID,
  p_admin_user_id UUID,
  p_admin_name  TEXT DEFAULT 'Admin'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Default leave types
  INSERT INTO public.leave_types (company_id, type_name, code, total_days)
  VALUES
    (p_company_id, 'Casual Leave', 'CL', 12),
    (p_company_id, 'Sick Leave',   'SL',  8),
    (p_company_id, 'Earned Leave', 'EL', 18),
    (p_company_id, 'Comp Off',     'CO',  6)
  ON CONFLICT DO NOTHING;

  -- Default subscription
  INSERT INTO public.subscriptions (company_id, plan, max_employees, expires_at)
  VALUES (p_company_id, 'free', 10, now() + INTERVAL '30 days')
  ON CONFLICT (company_id) DO NOTHING;

  -- Default company settings
  INSERT INTO public.company_settings (company_id, setting_key, setting_value) VALUES
    (p_company_id, 'working_days',       '["Mon","Tue","Wed","Thu","Fri"]'),
    (p_company_id, 'working_hours',      '{"start":"09:00","end":"18:00"}'),
    (p_company_id, 'gps_interval_secs',  '60'),
    (p_company_id, 'late_threshold_mins','15'),
    (p_company_id, 'overtime_threshold', '9'),
    (p_company_id, 'currency',           '"INR"')
  ON CONFLICT (company_id, setting_key) DO NOTHING;

  -- Default org settings (role permissions blob)
  INSERT INTO public.org_settings (
    company_id, role_permissions, custom_roles, custom_departments, custom_branches
  ) VALUES (
    p_company_id,
    '{
      "Super Administrator": ["dashboard","employees","tracking","attendance","shifts","payroll","leaves","visits","tasks","routes","geofence","reports","documents","notifications","settings"],
      "Manager":             ["dashboard","employees","tracking","attendance","shifts","payroll","leaves","visits","tasks","routes","geofence","reports","documents","notifications"],
      "Field Agent":         ["dashboard","tracking","attendance","leaves","visits","tasks","routes","notifications"],
      "Sales Executive":     ["dashboard","tracking","attendance","leaves","visits","tasks","routes","notifications"],
      "Logistics Rider":     ["dashboard","tracking","attendance","leaves","visits","tasks","routes","notifications"]
    }'::JSONB,
    '["Super Administrator","Manager","Field Agent","Sales Executive","Logistics Rider"]'::JSONB,
    '["Operations","Sales","Logistics","Customer Support","Human Resources"]'::JSONB,
    '["HQ Office"]'::JSONB
  ) ON CONFLICT (company_id) DO NOTHING;
END $$;

-- =====================================================================
-- 28. LEAVE APPROVAL NOTIFICATION TRIGGER
-- =====================================================================
CREATE OR REPLACE FUNCTION public.notify_leave_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_notif_id TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved','rejected') THEN
    v_notif_id := 'NTF-' || gen_random_uuid()::text;
    INSERT INTO public.notifications (
      id, company_id, title, description, type, priority, time, reference_id, reference_type
    ) VALUES (
      v_notif_id,
      NEW.company_id,
      CASE WHEN NEW.status = 'approved' THEN 'Leave Approved' ELSE 'Leave Rejected' END,
      CASE WHEN NEW.status = 'approved'
        THEN NEW.employee_name || ' leave from ' || NEW.start_date || ' to ' || NEW.end_date || ' approved.'
        ELSE NEW.employee_name || ' leave request rejected. ' || COALESCE(NEW.rejection_reason,'')
      END,
      'System', 'High',
      to_char(now(), 'HH12:MI AM'),
      NEW.id,
      'leaves'
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_leave_notification ON public.leaves;
CREATE TRIGGER trg_leave_notification
  AFTER UPDATE ON public.leaves
  FOR EACH ROW EXECUTE FUNCTION public.notify_leave_status_change();

-- =====================================================================
-- 29. TASK ASSIGNMENT NOTIFICATION TRIGGER
-- =====================================================================
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_notif_id TEXT;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.employee_id IS DISTINCT FROM NEW.employee_id) THEN
    v_notif_id := 'NTF-' || gen_random_uuid()::text;
    INSERT INTO public.notifications (
      id, company_id, title, description, type, priority, time, reference_id, reference_type
    ) VALUES (
      v_notif_id,
      NEW.company_id,
      'Task Assigned',
      'New task assigned to ' || NEW.employee_name || ': ' || NEW.title,
      'Task',
      CASE NEW.priority WHEN 'High' THEN 'High' ELSE 'Low' END,
      to_char(now(), 'HH12:MI AM'),
      NEW.id,
      'tasks'
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_task_notification ON public.tasks;
CREATE TRIGGER trg_task_notification
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- =====================================================================
-- 30. ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE public.companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions    ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 31. RLS POLICIES — tenant isolation via my_company_id()
-- =====================================================================
DO $$
DECLARE
  t TEXT;
  policy TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'employees','attendance','geofences','shifts','shift_assignments',
    'leave_types','leave_balances','leaves','salary_configs','payslips',
    'visits','tasks','documents','notifications','reports',
    'company_settings','org_settings','audit_logs','subscriptions'
  ] LOOP
    policy := 'rls_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%s', policy, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%s FOR ALL USING (company_id = public.my_company_id())',
      policy, t
    );
  END LOOP;
END $$;

-- Companies: user sees only their own company
DROP POLICY IF EXISTS rls_companies ON public.companies;
CREATE POLICY rls_companies ON public.companies
  FOR ALL USING (id = public.my_company_id());

-- Users: see only users in same company
DROP POLICY IF EXISTS rls_users ON public.users;
CREATE POLICY rls_users ON public.users
  FOR ALL USING (company_id = public.my_company_id());

-- Modules: readable by all authenticated users (shared lookup table)
DROP POLICY IF EXISTS rls_modules ON public.modules;
CREATE POLICY rls_modules ON public.modules FOR SELECT USING (auth.uid() IS NOT NULL);

-- Roles: scoped to company
DROP POLICY IF EXISTS rls_roles ON public.roles;
CREATE POLICY rls_roles ON public.roles FOR ALL USING (company_id = public.my_company_id());

-- Role permissions: scoped via roles
DROP POLICY IF EXISTS rls_role_permissions ON public.role_permissions;
CREATE POLICY rls_role_permissions ON public.role_permissions
  FOR ALL USING (role_id IN (SELECT id FROM public.roles WHERE company_id = public.my_company_id()));

-- Attendance: admins see all, employees see only own
DROP POLICY IF EXISTS rls_attendance ON public.attendance;
CREATE POLICY rls_attendance ON public.attendance
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.has_permission('employees')
      OR employee_id IN (SELECT id FROM public.employees WHERE auth_user_id = auth.uid())
      OR employee_id IN (SELECT id FROM public.employees WHERE LOWER(email) = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Location tracking: admins see all, employees see own
DROP POLICY IF EXISTS rls_locations ON public.employee_locations;
CREATE POLICY rls_locations ON public.employee_locations
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.has_permission('tracking')
      OR employee_id IN (SELECT id FROM public.employees WHERE LOWER(email) = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Leaves: admins see all, employees see own
DROP POLICY IF EXISTS rls_leaves ON public.leaves;
CREATE POLICY rls_leaves ON public.leaves
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.has_permission('employees')
      OR LOWER(employee_email) = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Tasks: admins see all, employees see assigned to them
DROP POLICY IF EXISTS rls_tasks ON public.tasks;
CREATE POLICY rls_tasks ON public.tasks
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.has_permission('employees')
      OR LOWER(employee_id) IN (
        SELECT id FROM public.employees WHERE LOWER(email) = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Salary: only admins with payroll permission
DROP POLICY IF EXISTS rls_salary ON public.salary_configs;
CREATE POLICY rls_salary ON public.salary_configs
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.has_permission('payroll')
      OR employee_id IN (SELECT id FROM public.employees WHERE LOWER(email) = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Payslips: same as salary
DROP POLICY IF EXISTS rls_payslips ON public.payslips;
CREATE POLICY rls_payslips ON public.payslips
  FOR ALL USING (
    company_id = public.my_company_id()
    AND (
      public.has_permission('payroll')
      OR employee_id IN (SELECT id FROM public.employees WHERE LOWER(email) = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- =====================================================================
-- 32. REALTIME
-- =====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaves;

-- =====================================================================
-- 33. .ENV.LOCAL TEMPLATE (paste into your .env.local file)
-- =====================================================================
-- VITE_SUPABASE_URL=https://vgycnidftvfvzemkpdvl.supabase.co
-- VITE_SUPABASE_ANON_KEY=<your-anon-key-here>

-- =====================================================================
-- DONE — After running this SQL:
-- 1. Create your .env.local with the two VITE_ variables above
-- 2. Sign up at /auth — a new company + org_settings row is created
-- 3. Role permissions saved via Settings panel persist to org_settings
-- 4. All future logins read org_settings → correct permissions applied
-- =====================================================================
SELECT 'TrackHive Production Schema v2.1 — Ready' AS status;

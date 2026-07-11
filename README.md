# TrackHive ERP

A field workforce management ERP — GPS tracking, attendance, payroll, leaves, tasks, visits, geofencing, and reports.

## Getting Started

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project URL and anon key from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api).

3. Set up the database:
   - Open the Supabase SQL Editor
   - Copy the schema from `src/lib/supabaseSync.ts` (the `SUPABASE_SQL_SCHEMA` constant)
   - Run it to create all required tables

4. Start the app:
   ```bash
   npm run dev
   ```

## Features

- **Live GPS Tracking** — Real-time employee location map
- **Attendance** — Selfie clock-in/out with face verification
- **Shifts** — Shift patterns and roster planning
- **Payroll** — Indian statutory payroll (EPF, ESIC, TDS, HRA)
- **Leaves** — Policy-based leave management and approvals
- **Client Visits** — Field visit logging and photo uploads
- **Tasks** — Kanban board with subtasks and attachments
- **Routes** — Daily GPS path history
- **Geofencing** — Location-based boundaries and alerts
- **Documents** — Compliance document vault
- **Reports** — Excel/CSV exports

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Supabase · Lucide React · Motion

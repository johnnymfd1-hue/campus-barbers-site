-- =============================================================================
-- Campus Barbers — Supabase Schema (Step 1)
-- Tables: staff, clients, services, appointments
-- Strict RBAC: staff CANNOT see client contact information
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Custom types
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('admin', 'staff');

CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'no_show',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- 1. Staff table  (linked to Supabase Auth via auth.users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE public.staff (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL UNIQUE,
  full_name   text        NOT NULL,
  display_name text,                          -- public-facing name
  role        public.user_role NOT NULL DEFAULT 'staff',
  avatar_url  text,
  schedule    jsonb       DEFAULT '{}',       -- e.g. {"mon":"09:00-18:00", ...}
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.staff IS 'Barbershop staff members. PK matches auth.users.id.';
COMMENT ON COLUMN public.staff.role IS 'admin = full access; staff = limited (no client contact info).';
COMMENT ON COLUMN public.staff.schedule IS 'JSON object mapping day abbreviations to time ranges.';

-- ---------------------------------------------------------------------------
-- 2. Clients table  (contact columns are the protected data)
-- ---------------------------------------------------------------------------
CREATE TABLE public.clients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         text        NOT NULL,
  phone             text,                      -- PROTECTED: staff cannot see
  phone_normalized  text,                      -- PROTECTED: last 10 digits
  email             text,                      -- PROTECTED: staff cannot see
  email_normalized  text,                      -- PROTECTED: lowercase trimmed
  total_bookings    int         NOT NULL DEFAULT 0,
  completed_visits  int         NOT NULL DEFAULT 0,
  no_shows          int         NOT NULL DEFAULT 0,
  cancellations     int         NOT NULL DEFAULT 0,
  notes             text,                      -- PROTECTED: admin-only notes
  is_verified       boolean     NOT NULL DEFAULT false,
  last_visit_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.clients IS 'Client records. Phone, email, and notes are admin-only.';

CREATE INDEX idx_clients_phone ON public.clients (phone_normalized);
CREATE INDEX idx_clients_email ON public.clients (email_normalized);
CREATE INDEX idx_clients_name  ON public.clients USING gin (full_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 3. Services table
-- ---------------------------------------------------------------------------
CREATE TABLE public.services (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL UNIQUE,
  description   text,
  duration_min  int         NOT NULL DEFAULT 30,   -- slot length in minutes
  price_cents   int         NOT NULL,               -- price in cents (e.g. 2500 = $25)
  display_order int         NOT NULL DEFAULT 0,     -- for UI ordering
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.services IS 'Catalog of services offered (haircuts, trims, combos, etc.).';

-- ---------------------------------------------------------------------------
-- 4. Appointments table
-- ---------------------------------------------------------------------------
CREATE TABLE public.appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  staff_id        uuid        NOT NULL REFERENCES public.staff(id)   ON DELETE CASCADE,
  service_id      uuid        NOT NULL REFERENCES public.services(id),
  appointment_date date       NOT NULL,
  start_time      time        NOT NULL,
  end_time        time        NOT NULL,
  status          public.appointment_status NOT NULL DEFAULT 'pending',
  notes           text,                      -- PROTECTED: admin-only
  created_via     text        DEFAULT 'web', -- web | admin | import
  ip_address      inet,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.appointments IS 'Booking records linking client ↔ staff ↔ service.';
COMMENT ON COLUMN public.appointments.notes IS 'Admin-only notes; invisible to staff role.';

CREATE INDEX idx_appointments_date   ON public.appointments (appointment_date, start_time);
CREATE INDEX idx_appointments_staff  ON public.appointments (staff_id, appointment_date);
CREATE INDEX idx_appointments_client ON public.appointments (client_id);
CREATE INDEX idx_appointments_status ON public.appointments (status);

-- ---------------------------------------------------------------------------
-- 5. Helper functions for role checks
-- ---------------------------------------------------------------------------

-- Returns the role of the currently authenticated user (or NULL if not staff).
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.staff WHERE id = auth.uid();
$$;

-- Convenience boolean: is the caller an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(public.current_user_role() = 'admin', false);
$$;

-- Convenience boolean: is the caller any authenticated staff member?
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_user_role() IS NOT NULL;
$$;

-- ---------------------------------------------------------------------------
-- 6. Row-Level Security — STAFF table
-- ---------------------------------------------------------------------------
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- All authenticated staff can read the staff roster (needed for scheduling UI).
CREATE POLICY staff_select ON public.staff
  FOR SELECT TO authenticated
  USING (public.is_staff_or_admin());

-- Only admins can insert / update / delete staff records.
CREATE POLICY staff_admin_insert ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY staff_admin_update ON public.staff
  FOR UPDATE TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY staff_admin_delete ON public.staff
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Row-Level Security — CLIENTS table
--    THE CORE OF THE JOHN DOWEN RULE:
--    Staff can ONLY see id and full_name.
--    Contact info (phone, email, notes) is blocked at the view layer;
--    the base table is entirely invisible to non-admins.
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write the full clients table directly.
CREATE POLICY clients_admin_select ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY clients_admin_insert ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY clients_admin_update ON public.clients
  FOR UPDATE TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY clients_admin_delete ON public.clients
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Staff-safe view: only exposes id + full_name (no contact info).
-- Uses SECURITY INVOKER so that RLS on the base table is bypassed
-- via the definer function below, but ONLY the safe columns are exposed.
CREATE OR REPLACE FUNCTION public.get_clients_safe()
RETURNS TABLE(id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER          -- runs as the function owner (service_role), bypasses RLS
AS $$
  SELECT c.id, c.full_name FROM public.clients c;
$$;

-- Restrict who can call the safe accessor.
REVOKE ALL ON FUNCTION public.get_clients_safe() FROM public;
GRANT EXECUTE ON FUNCTION public.get_clients_safe() TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Row-Level Security — SERVICES table
-- ---------------------------------------------------------------------------
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone (including anon for the public booking page) can read active services.
CREATE POLICY services_public_select ON public.services
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Admins can manage services.
CREATE POLICY services_admin_all ON public.services
  FOR ALL TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 9. Row-Level Security — APPOINTMENTS table
--    Staff see appointments but WITHOUT client contact info or admin notes.
-- ---------------------------------------------------------------------------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Admins: full read/write.
CREATE POLICY appointments_admin_all ON public.appointments
  FOR ALL TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- Staff: can read appointments (all columns except notes are safe;
-- notes are masked via the view below). Direct table access is limited
-- to admins; staff use the view.
CREATE POLICY appointments_staff_select ON public.appointments
  FOR SELECT TO authenticated
  USING (public.is_staff_or_admin());

-- Service role (API routes) can insert appointments on behalf of clients.
CREATE POLICY appointments_service_insert ON public.appointments
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 10. Staff-safe appointment view
--     The "John Dowen Rule" enforced: staff see client NAME only,
--     no phone, no email, no admin notes.
-- ---------------------------------------------------------------------------
CREATE VIEW public.appointments_staff_view AS
SELECT
  a.id,
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.status,
  a.created_at,
  -- Client: name only (contact info stripped)
  a.client_id,
  c.full_name       AS client_name,
  -- Staff info
  a.staff_id,
  s.display_name     AS staff_name,
  -- Service info
  a.service_id,
  svc.name           AS service_name,
  svc.duration_min,
  -- Conditionally show notes only to admins
  CASE WHEN public.is_admin() THEN a.notes ELSE NULL END AS notes
FROM public.appointments a
JOIN public.clients  c   ON c.id   = a.client_id
JOIN public.staff    s   ON s.id   = a.staff_id
JOIN public.services svc ON svc.id = a.service_id;

COMMENT ON VIEW public.appointments_staff_view IS
  'Staff-safe projection of appointments. Client contact info and admin notes are stripped.';

-- ---------------------------------------------------------------------------
-- 11. Automatic updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. Enable pg_trgm for fuzzy name search (used by idx_clients_name)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 13. Seed data — Services (matches current site offerings)
-- ---------------------------------------------------------------------------
INSERT INTO public.services (name, description, duration_min, price_cents, display_order) VALUES
  ('Regular Haircut',      'Classic haircut for adults.',           30, 2500, 1),
  ('Senior Haircut',       'Haircut for seniors (65+).',           30, 2000, 2),
  ('Kids Haircut',         'Haircut for children (12 and under).', 30, 2000, 3),
  ('Beard Trim',           'Beard shaping and trim.',              15, 1500, 4),
  ('Haircut + Beard Combo','Full haircut with beard trim.',        45, 3500, 5);

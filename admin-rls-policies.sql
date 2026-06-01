-- SQL policy notes for Supabase RLS to allow admin read access.
-- Apply these policies for admin access to the users table and to all tables.

-- 1. Users table should be readable by admin
CREATE POLICY "Admins can read users" ON public.users
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 2. All tables should be readable by admins
-- Replace table_name with each table you want admins to read.
-- Example for products:
CREATE POLICY "Admins can read products" ON public.products
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Example for orders:
CREATE POLICY "Admins can read orders" ON public.orders
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Example for group_buys:
CREATE POLICY "Admins can read group_buys" ON public.group_buys
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Example for festival_boosts:
CREATE POLICY "Admins can read festival_boosts" ON public.festival_boosts
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Repeat for any other tables that should be readable by admin role.

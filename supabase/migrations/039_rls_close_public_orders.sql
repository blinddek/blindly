-- 039: Close public access to orders and quotes (intake survey, 2026-10-05)
--
-- 030 granted anon SELECT USING (true) on blindly_orders, blindly_order_items and saved_quotes
-- ("guest checkout: orders looked up by ID/number"), and anon INSERT on the two order tables.
-- With RLS enforced in production (measured 2026-10-05), that lets anyone holding the public
-- anon key read every customer's name, email, phone and address, and insert orders directly.
--
-- Nothing in the app needs them: checkout (app/api/blinds/checkout), the PayFast ITN webhook and
-- every admin read use the service-role client, and /cart/success shows only the reference from
-- its own URL. The "Admin full access" policies from 030 remain.

DROP POLICY IF EXISTS "Orders readable by all" ON blindly_orders;
DROP POLICY IF EXISTS "Anyone can create blindly orders" ON blindly_orders;

DROP POLICY IF EXISTS "Order items readable with order" ON blindly_order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON blindly_order_items;

DROP POLICY IF EXISTS "Quotes readable by token" ON saved_quotes;

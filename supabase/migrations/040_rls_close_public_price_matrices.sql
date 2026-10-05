-- 040: Close public read on price_matrices (gate G-03, decided 2026-10-05)
--
-- 030 granted SELECT USING (true) on price_matrices ("customers need live pricing"). The rows are
-- Shademaster supplier cost prices, so anyone holding the public anon key could read all of them
-- (11,501 rows, measured 2026-10-05) and with them the shop's margin. Supplier prices are not public.
--
-- Nothing public needs the policy: lib/pricing/lookup.ts and lib/pricing/grid.ts read with the
-- service-role client (grid.ts moved there in the same change), and the admin import screen reads
-- through the browser client as an admin, which "Admin full access to prices" from 030 still allows.
--
-- APPLY ONLY AFTER the code that moved grid.ts to the service client is deployed — before it, the
-- configurator's width/drop grid reads as empty.

DROP POLICY IF EXISTS "Prices readable by all" ON price_matrices;

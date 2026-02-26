-- ============================================================
-- MIGRATION 005: QUOTES, SWATCH REQUESTS & LEAD CAPTURE
-- ============================================================

CREATE TABLE saved_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_token TEXT UNIQUE NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  cart_data JSONB NOT NULL,
  total_cents INTEGER NOT NULL,
  email_sent_24h BOOLEAN DEFAULT false,
  email_sent_72h BOOLEAN DEFAULT false,
  email_sent_7d BOOLEAN DEFAULT false,
  converted_to_order_id UUID REFERENCES orders(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_saved_quotes_token ON saved_quotes(quote_token);
CREATE INDEX idx_saved_quotes_email ON saved_quotes(customer_email);
CREATE INDEX idx_saved_quotes_created ON saved_quotes(created_at DESC);

CREATE TABLE swatch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address JSONB NOT NULL,
  blind_range_id UUID REFERENCES blind_ranges(id),
  colour TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'sent', 'delivered')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON swatch_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE measure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address JSONB,
  preferred_method TEXT DEFAULT 'in_person' CHECK (preferred_method IN ('in_person', 'virtual')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON measure_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

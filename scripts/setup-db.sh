#!/usr/bin/env bash
# ============================================================
# setup-db.sh — Tier-aware migration runner
#
# Reads config/site.ts to determine tier + enabled features,
# then selectively runs the correct Supabase migration files.
#
# Usage:
#   ./scripts/setup-db.sh                     # auto-detect from config
#   ./scripts/setup-db.sh --industry trades   # also run industry seed
#   ./scripts/setup-db.sh --dry-run           # print what would run
#   ./scripts/setup-db.sh --reset             # wipe & rebuild (careful!)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"
SEED_FILE="$ROOT_DIR/supabase/seed.sql"
INDUSTRY_DIR="$ROOT_DIR/scripts/seed-industry"
CONFIG_FILE="$ROOT_DIR/config/site.ts"

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No colour

# ── Defaults ─────────────────────────────────────────────────
DRY_RUN=false
RESET=false
INDUSTRY=""

# ── Parse args ───────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)   DRY_RUN=true; shift ;;
    --reset)     RESET=true; shift ;;
    --industry)  INDUSTRY="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: setup-db.sh [--industry <name>] [--dry-run] [--reset]"
      echo ""
      echo "Options:"
      echo "  --industry <name>  Run industry seed (trades|professional|retail|hospitality|health|generic)"
      echo "  --dry-run          Print migration plan without executing"
      echo "  --reset            Reset database before running migrations (destructive!)"
      echo ""
      echo "Reads tier + features from config/site.ts to determine which migrations to run."
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

# ── Validate prerequisites ───────────────────────────────────
if ! command -v supabase &>/dev/null; then
  echo -e "${RED}Error: supabase CLI not found. Install it first:${NC}"
  echo "  npx supabase --version  (or)  brew install supabase/tap/supabase"
  exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo -e "${RED}Error: config/site.ts not found at $CONFIG_FILE${NC}"
  exit 1
fi

# ── Parse config/site.ts ─────────────────────────────────────
# Extract tier
TIER=$(grep -oP 'tier:\s*"(\K[^"]+)' "$CONFIG_FILE" || echo "brochure")

# Extract feature flags (only explicitly true ones)
extract_feature() {
  local feature="$1"
  grep -qP "${feature}:\s*true" "$CONFIG_FILE" && echo "true" || echo "false"
}

FEAT_BLOG=$(extract_feature "blog")
FEAT_PORTFOLIO=$(extract_feature "portfolio")
FEAT_BOOKING=$(extract_feature "booking")
FEAT_SHOP=$(extract_feature "shop")
FEAT_LMS=$(extract_feature "lms")
FEAT_NEWSLETTER=$(extract_feature "newsletter")
FEAT_CUSTOMER_AUTH=$(extract_feature "customerAuth")
FEAT_GOOGLE_CALENDAR=$(extract_feature "googleCalendar")
FEAT_SESSION_CREDITS=$(extract_feature "sessionCredits")
FEAT_BILLING=$(extract_feature "billing")
FEAT_LEGAL_DOCS=$(extract_feature "legalDocs")
FEAT_CLIENT_ONBOARDING=$(extract_feature "clientOnboarding")
FEAT_EMAIL_CAMPAIGNS=$(extract_feature "emailCampaigns")
FEAT_DRIP_EMAILS=$(extract_feature "dripEmails")
FEAT_HYBRID_PACKAGES=$(extract_feature "hybridPackages")
FEAT_COUPONS=$(extract_feature "coupons")
FEAT_GIFTS=$(extract_feature "gifts")
FEAT_CLIENT_IMPORT=$(extract_feature "clientImport")
FEAT_MICROSOFT_GRAPH=$(extract_feature "microsoftGraph")
FEAT_WHATSAPP=$(extract_feature "whatsapp")

# Apply tier defaults (mirrors config/features.ts TIER_FEATURES)
case "$TIER" in
  commerce)
    [[ "$FEAT_BLOG" == "false" ]]       && FEAT_BLOG="true"
    [[ "$FEAT_PORTFOLIO" == "false" ]]   && FEAT_PORTFOLIO="true"
    [[ "$FEAT_NEWSLETTER" == "false" ]]  && FEAT_NEWSLETTER="true"
    [[ "$FEAT_SHOP" == "false" ]]        && FEAT_SHOP="true"
    [[ "$FEAT_CUSTOMER_AUTH" == "false" ]] && FEAT_CUSTOMER_AUTH="true"
    [[ "$FEAT_BILLING" == "false" ]]     && FEAT_BILLING="true"
    [[ "$FEAT_COUPONS" == "false" ]]     && FEAT_COUPONS="true"
    ;;
  business)
    [[ "$FEAT_BLOG" == "false" ]]       && FEAT_BLOG="true"
    [[ "$FEAT_PORTFOLIO" == "false" ]]   && FEAT_PORTFOLIO="true"
    [[ "$FEAT_NEWSLETTER" == "false" ]]  && FEAT_NEWSLETTER="true"
    ;;
esac

# ── Dependency validation ────────────────────────────────────
if [[ "$FEAT_SESSION_CREDITS" == "true" ]]; then
  if [[ "$FEAT_BOOKING" != "true" || "$FEAT_CUSTOMER_AUTH" != "true" ]]; then
    echo -e "${RED}Error: sessionCredits requires booking + customerAuth to be enabled.${NC}"
    exit 1
  fi
fi

if [[ "$FEAT_BILLING" == "true" && "$FEAT_CUSTOMER_AUTH" != "true" ]]; then
  echo -e "${RED}Error: billing requires customerAuth to be enabled.${NC}"
  exit 1
fi

if [[ "$FEAT_CLIENT_ONBOARDING" == "true" && "$FEAT_CUSTOMER_AUTH" != "true" ]]; then
  echo -e "${RED}Error: clientOnboarding requires customerAuth to be enabled.${NC}"
  exit 1
fi

if [[ "$FEAT_HYBRID_PACKAGES" == "true" ]]; then
  if [[ "$FEAT_SHOP" != "true" && "$FEAT_BOOKING" != "true" ]]; then
    echo -e "${RED}Error: hybridPackages requires shop or booking to be enabled.${NC}"
    exit 1
  fi
fi

if [[ "$FEAT_COUPONS" == "true" ]]; then
  if [[ "$FEAT_SHOP" != "true" && "$FEAT_BOOKING" != "true" ]]; then
    echo -e "${RED}Error: coupons requires shop or booking to be enabled.${NC}"
    exit 1
  fi
fi

if [[ "$FEAT_CLIENT_IMPORT" == "true" && "$FEAT_CUSTOMER_AUTH" != "true" ]]; then
  echo -e "${RED}Error: clientImport requires customerAuth to be enabled.${NC}"
  exit 1
fi

if [[ "$FEAT_MICROSOFT_GRAPH" == "true" && "$FEAT_BOOKING" != "true" ]]; then
  echo -e "${RED}Error: microsoftGraph requires booking to be enabled.${NC}"
  exit 1
fi

# ── Build migration list ─────────────────────────────────────
MIGRATIONS=()

# Core — always run
MIGRATIONS+=("001_foundation.sql")
MIGRATIONS+=("002_auth.sql")
MIGRATIONS+=("003_contact.sql")

# Feature-conditional
[[ "$FEAT_NEWSLETTER" == "true" ]]     && MIGRATIONS+=("004_newsletter.sql")
[[ "$FEAT_BLOG" == "true" ]]           && MIGRATIONS+=("005_blog.sql")
[[ "$FEAT_PORTFOLIO" == "true" ]]      && MIGRATIONS+=("006_portfolio.sql")
[[ "$FEAT_BOOKING" == "true" ]]        && MIGRATIONS+=("007_booking.sql")

if [[ "$FEAT_SHOP" == "true" ]]; then
  MIGRATIONS+=("008_shop.sql")
  MIGRATIONS+=("009_payments.sql")
fi

[[ "$FEAT_LMS" == "true" ]]            && MIGRATIONS+=("010_lms.sql")
[[ "$FEAT_CUSTOMER_AUTH" == "true" ]]   && MIGRATIONS+=("011_customer_profiles.sql")

if [[ "$FEAT_GOOGLE_CALENDAR" == "true" ]]; then
  if [[ "$FEAT_BOOKING" != "true" ]]; then
    echo -e "${RED}Error: googleCalendar requires booking to be enabled.${NC}"
    exit 1
  fi
  MIGRATIONS+=("012_integrations.sql")
fi

# Advanced SEO (opt-in)
FEAT_SEO_ADVANCED=$(extract_feature "seoAdvanced")
[[ "$FEAT_SEO_ADVANCED" == "true" ]] && MIGRATIONS+=("013_seo_advanced.sql")

# Cron runs — always run (infrastructure)
MIGRATIONS+=("014_cron_runs.sql")

# ── New migrations (015–025) ─────────────────────────────────

# Password reset tokens (when customerAuth)
[[ "$FEAT_CUSTOMER_AUTH" == "true" ]] && MIGRATIONS+=("015_password_reset.sql")

# Email templates + logs (always)
MIGRATIONS+=("016_email_templates.sql")

# Extended profile columns (when customerAuth)
[[ "$FEAT_CUSTOMER_AUTH" == "true" ]] && MIGRATIONS+=("017_extended_profiles.sql")

# Booking enhancements: cancel/reschedule/notes (when booking)
[[ "$FEAT_BOOKING" == "true" ]] && MIGRATIONS+=("018_booking_enhancements.sql")

# Session credits (when sessionCredits)
[[ "$FEAT_SESSION_CREDITS" == "true" ]] && MIGRATIONS+=("019_session_credits.sql")

# Invoicing (when billing)
[[ "$FEAT_BILLING" == "true" ]] && MIGRATIONS+=("020_invoicing.sql")

# WhatsApp server-side templates + logs (when whatsapp)
[[ "$FEAT_WHATSAPP" == "true" ]] && MIGRATIONS+=("021_whatsapp.sql")

# Campaigns + drip sequences (when emailCampaigns or dripEmails)
if [[ "$FEAT_EMAIL_CAMPAIGNS" == "true" || "$FEAT_DRIP_EMAILS" == "true" ]]; then
  MIGRATIONS+=("022_campaigns.sql")
fi

# Legal documents + acceptances (when legalDocs)
[[ "$FEAT_LEGAL_DOCS" == "true" ]] && MIGRATIONS+=("023_legal_documents.sql")

# Client intake forms (when clientOnboarding)
[[ "$FEAT_CLIENT_ONBOARDING" == "true" ]] && MIGRATIONS+=("024_client_intake.sql")

# Commerce extras: packages, coupons, gifts
if [[ "$FEAT_HYBRID_PACKAGES" == "true" || "$FEAT_COUPONS" == "true" || "$FEAT_GIFTS" == "true" ]]; then
  MIGRATIONS+=("025_commerce_extras.sql")
fi

# ── Print plan ───────────────────────────────────────────────
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         Yoros Template — DB Setup            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Tier:     ${GREEN}${TIER}${NC}"
echo -e "  Features: blog=${FEAT_BLOG} portfolio=${FEAT_PORTFOLIO} booking=${FEAT_BOOKING}"
echo -e "            shop=${FEAT_SHOP} lms=${FEAT_LMS} newsletter=${FEAT_NEWSLETTER}"
echo -e "            customerAuth=${FEAT_CUSTOMER_AUTH} googleCalendar=${FEAT_GOOGLE_CALENDAR}"
echo -e "            sessionCredits=${FEAT_SESSION_CREDITS} billing=${FEAT_BILLING}"
echo -e "            legalDocs=${FEAT_LEGAL_DOCS} clientOnboarding=${FEAT_CLIENT_ONBOARDING}"
echo -e "            emailCampaigns=${FEAT_EMAIL_CAMPAIGNS} dripEmails=${FEAT_DRIP_EMAILS}"
echo -e "            whatsapp=${FEAT_WHATSAPP} coupons=${FEAT_COUPONS} gifts=${FEAT_GIFTS}"
echo -e "            hybridPackages=${FEAT_HYBRID_PACKAGES} microsoftGraph=${FEAT_MICROSOFT_GRAPH}"
echo ""
echo -e "${YELLOW}Migrations to run:${NC}"
for m in "${MIGRATIONS[@]}"; do
  echo -e "  ${GREEN}✓${NC} $m"
done
echo ""
echo -e "${YELLOW}Seeds:${NC}"
echo -e "  ${GREEN}✓${NC} seed.sql (generic)"
if [[ -n "$INDUSTRY" ]]; then
  if [[ -f "$INDUSTRY_DIR/${INDUSTRY}.sql" ]]; then
    echo -e "  ${GREEN}✓${NC} seed-industry/${INDUSTRY}.sql"
  else
    echo -e "  ${RED}✗${NC} seed-industry/${INDUSTRY}.sql (not found!)"
    echo -e "${RED}Available: trades, professional, retail, hospitality, health, generic${NC}"
    exit 1
  fi
fi
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}Dry run — no changes made.${NC}"
  exit 0
fi

# ── Confirm destructive reset ────────────────────────────────
if [[ "$RESET" == "true" ]]; then
  echo -e "${RED}⚠  --reset will wipe the database and rebuild from scratch.${NC}"
  read -rp "Are you sure? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
  echo -e "${YELLOW}Resetting database...${NC}"
  supabase db reset --no-seed
  echo ""
fi

# ── Run migrations ───────────────────────────────────────────
echo -e "${CYAN}Running migrations...${NC}"
for m in "${MIGRATIONS[@]}"; do
  file="$MIGRATIONS_DIR/$m"
  if [[ ! -f "$file" ]]; then
    echo -e "  ${RED}✗${NC} $m — file not found, skipping"
    continue
  fi
  echo -ne "  ${YELLOW}▸${NC} $m ... "
  if supabase db push --include "$file" 2>/dev/null; then
    echo -e "${GREEN}done${NC}"
  else
    # Fallback: run via psql if db push doesn't support --include
    if command -v psql &>/dev/null; then
      psql "$DATABASE_URL" -f "$file" -q 2>/dev/null && echo -e "${GREEN}done (psql)${NC}" || {
        echo -e "${RED}failed${NC}"
        exit 1
      }
    else
      echo -e "${RED}failed${NC}"
      echo -e "${RED}Try setting DATABASE_URL env var for psql fallback.${NC}"
      exit 1
    fi
  fi
done

# ── Run seeds ────────────────────────────────────────────────
echo ""
echo -e "${CYAN}Running seeds...${NC}"

run_seed() {
  local file="$1"
  local label="$2"
  echo -ne "  ${YELLOW}▸${NC} $label ... "
  if supabase db push --include "$file" 2>/dev/null; then
    echo -e "${GREEN}done${NC}"
  elif command -v psql &>/dev/null; then
    psql "$DATABASE_URL" -f "$file" -q 2>/dev/null && echo -e "${GREEN}done (psql)${NC}" || {
      echo -e "${RED}failed${NC}"
      exit 1
    }
  else
    echo -e "${RED}failed${NC}"
    exit 1
  fi
}

run_seed "$SEED_FILE" "seed.sql"

if [[ -n "$INDUSTRY" ]]; then
  run_seed "$INDUSTRY_DIR/${INDUSTRY}.sql" "seed-industry/${INDUSTRY}.sql"
fi

# ── Generate types ───────────────────────────────────────────
echo ""
echo -e "${CYAN}Generating TypeScript types...${NC}"
if supabase gen types typescript --local > "$ROOT_DIR/types/database.types.ts" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} types/database.types.ts updated"
elif supabase gen types typescript > "$ROOT_DIR/types/database.types.ts" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} types/database.types.ts updated (remote)"
else
  echo -e "  ${YELLOW}⚠${NC} Type generation skipped (no local/remote Supabase project linked)"
fi

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Database setup complete! ✓           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Create admin user:  supabase auth admin create-user --email admin@example.com --password <pw>"
echo "  2. Set admin role:     UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@example.com';"
echo "  3. Start dev server:   npm run dev"

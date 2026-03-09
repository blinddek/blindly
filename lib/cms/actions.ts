"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { LocalizedString } from "@/types/cms";
import { ensureAdmin } from "@/lib/admin/auth";

// ---- site_content ----

export async function updateSiteContent(
  sectionKey: string,
  content: Record<string, unknown>
) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_content")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("section_key", sectionKey);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

/**
 * Upsert site content — inserts if missing, updates if exists.
 * Useful for page editors where the row may not exist yet.
 */
export async function upsertSiteContent(
  sectionKey: string,
  content: Record<string, unknown>
) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_content")
    .upsert(
      { section_key: sectionKey, content, updated_at: new Date().toISOString() },
      { onConflict: "section_key" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// ---- nav_links ----

export async function upsertNavLink(data: {
  id?: string;
  label: LocalizedString;
  href: string;
  display_order: number;
  is_active: boolean;
  hide_in_nav?: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("nav_links").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteNavLink(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("nav_links").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function reorderNavLinks(orderedIds: string[]) {
  await ensureAdmin();
  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("nav_links").update({ display_order: index }).eq("id", id)
    )
  );
  revalidatePath("/");
}

// ---- footer_sections ----

export async function upsertFooterSection(data: {
  id?: string;
  title: LocalizedString;
  links: { label: LocalizedString; href: string }[];
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("footer_sections").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteFooterSection(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("footer_sections")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// ---- how_it_works_steps ----

export async function upsertHowItWorksStep(data: {
  id?: string;
  step_number: string;
  icon: string;
  title: LocalizedString;
  description: LocalizedString;
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("how_it_works_steps").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteHowItWorksStep(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("how_it_works_steps")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// ---- homepage_services ----

export async function upsertHomepageService(data: {
  id?: string;
  icon: string;
  title: LocalizedString;
  description: LocalizedString;
  slug: string;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("homepage_services").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteHomepageService(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("homepage_services")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// ---- portfolio_items ----

export async function upsertPortfolioItem(data: {
  id?: string;
  slug: string;
  title: LocalizedString;
  description?: LocalizedString;
  hero_image_url?: string | null;
  images?: string[];
  alt_text?: LocalizedString | null;
  industry?: string | null;
  features?: LocalizedString[];
  tech_stack?: string[];
  live_url?: string | null;
  is_featured?: boolean;
  display_order?: number;
  is_published?: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("portfolio_items").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/portfolio");
  revalidatePath("/admin/portfolio");
}

/** Soft-delete a portfolio item (sets deleted_at) */
export async function deletePortfolioItem(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("portfolio_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portfolio");
  revalidatePath("/admin/portfolio");
}

// ---- pricing_tiers ----

export async function upsertPricingTier(data: {
  id?: string;
  name: LocalizedString;
  price: string;
  monthly_price?: string | null;
  monthly_price_cents?: number | null;
  perfect_for?: LocalizedString | null;
  description: LocalizedString;
  features: LocalizedString[];
  is_popular: boolean;
  cta_label?: LocalizedString;
  cta_url?: string;
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("pricing_tiers").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/pricing");
}

export async function deletePricingTier(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pricing_tiers")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// ---- faqs ----

export async function upsertFaq(data: {
  id?: string;
  question: LocalizedString;
  answer: LocalizedString;
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("faqs").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteFaq(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

// ---- services ----

export async function upsertService(data: {
  id?: string;
  feature_key: string;
  name: LocalizedString;
  description?: LocalizedString;
  category: string;
  base_price_cents: number;
  icon?: string;
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("services").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
}

export async function deleteService(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
}

// ---- service_dependencies ----

export async function upsertServiceDependency(data: {
  id?: string;
  feature_key: string;
  requires_key: string;
  auto_add: boolean;
  message?: LocalizedString;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("service_dependencies").upsert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/dependencies");
}

export async function deleteServiceDependency(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("service_dependencies")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/dependencies");
}

// ---- pricing_config ----

export async function updatePricingConfig(key: string, value: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pricing_config")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/pricing-config");
}

export async function upsertPricingConfig(data: {
  key: string;
  value: string;
  description?: string;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("pricing_config").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/pricing-config");
}

// ---- industry_templates ----

export async function upsertIndustryTemplate(data: {
  id?: string;
  industry_key: string;
  label: LocalizedString;
  icon?: string;
  examples?: LocalizedString[];
  default_features: string[];
  recommended_features?: string[];
  typical_page_count: number;
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("industry_templates").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/industries");
}

export async function deleteIndustryTemplate(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("industry_templates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/industries");
}

// ---- goal_feature_mapping ----

export async function upsertGoalMapping(data: {
  id?: string;
  goal_key: string;
  label: LocalizedString;
  maps_to_features: string[];
  pre_checked_for?: string[];
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("goal_feature_mapping").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/goals");
}

export async function deleteGoalMapping(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("goal_feature_mapping")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/goals");
}

// ---- portfolio_examples ----

export async function upsertPortfolioExample(data: {
  id?: string;
  project_name: LocalizedString;
  industry_keys: string[];
  style_tags?: string[];
  style_label?: LocalizedString;
  screenshot_desktop_url?: string;
  screenshot_mobile_url?: string;
  live_url?: string;
  features_showcased?: string[];
  display_order: number;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("portfolio_examples").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/portfolio-examples");
}

export async function deletePortfolioExample(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("portfolio_examples")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/portfolio-examples");
}

// ---- feature_descriptions ----

export async function upsertFeatureDescription(data: {
  id?: string;
  feature_key: string;
  industry_key?: string | null;
  heading: LocalizedString;
  description: LocalizedString;
  icon?: string;
  is_addon_description: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("feature_descriptions").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/descriptions");
}

export async function deleteFeatureDescription(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feature_descriptions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services/descriptions");
}

// ---- blog_categories ----

export async function upsertBlogCategory(data: {
  id?: string;
  name: LocalizedString;
  slug: string;
  description?: LocalizedString | null;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("blog_categories").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

export async function deleteBlogCategory(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blog_categories")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

// ---- blog_posts ----

export async function upsertBlogPost(data: {
  id?: string;
  slug: string;
  title: LocalizedString;
  excerpt?: LocalizedString;
  content?: LocalizedString;
  author: string;
  category_id?: string | null;
  tags?: string[];
  featured_image_url?: string | null;
  is_published?: boolean;
  published_at?: string | null;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("blog_posts").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

/** Soft-delete a blog post (sets deleted_at) */
export async function deleteBlogPost(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("blog_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

// ---- onboarding_templates ----

export async function upsertOnboardingTemplate(data: {
  id?: string;
  item_key: string;
  title: LocalizedString;
  description?: LocalizedString | null;
  tutorial_steps?: unknown[];
  video_url?: string | null;
  input_type: string;
  feature_key?: string | null;
  payment_model?: string;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
}) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("onboarding_templates").upsert({
    ...data,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/onboarding");
}

export async function deleteOnboardingTemplate(id: string) {
  await ensureAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("onboarding_templates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/onboarding");
}

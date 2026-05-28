"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai/provider";
import { renderBriefPrompt } from "@/lib/ai/prompts/brief";
import { renderCopyPrompt } from "@/lib/ai/prompts/copy";
import { renderDesignPrompt } from "@/lib/ai/prompts/design-prompt";
import type {
  BrandContext,
  ProjectContext,
} from "@/lib/ai/prompts/types";
import type { AIAssetKind } from "@/lib/types/db";

async function loadContext(projectId: string): Promise<{
  ok: boolean;
  project?: ProjectContext;
  brand?: BrandContext;
  organizationId?: string | null;
  ownerUserId?: string | null;
  error?: string;
}> {
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("projects")
    .select(
      "id,title,service_type,service_id,user_id,inquiry_id,quote_id,organization_id",
    )
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return { ok: false, error: "프로젝트를 찾을 수 없습니다" };

  const [{ data: inquiry }, { data: quote }, { data: comments }, { data: brand }, { data: service }] =
    await Promise.all([
      project.inquiry_id
        ? admin
            .from("inquiries")
            .select("name,company,message,budget_range")
            .eq("id", project.inquiry_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      project.quote_id
        ? admin
            .from("quotes")
            .select("notes,delivery_days,base_price,total_price")
            .eq("id", project.quote_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from("project_comments")
        .select("body,is_internal,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(5),
      project.user_id
        ? admin
            .from("brand_profiles")
            .select("*")
            .eq("user_id", project.user_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      project.service_id
        ? admin
            .from("services")
            .select("key,name,name_en")
            .eq("id", project.service_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const projectCtx: ProjectContext = {
    title: project.title,
    serviceType: project.service_type,
    serviceKey: service?.key ?? null,
    description: quote?.notes ?? null,
    inquiryMessage: inquiry?.message ?? null,
    customerName: inquiry?.name ?? null,
    companyName: inquiry?.company ?? null,
    budget: inquiry?.budget_range ?? null,
    deliveryDays: quote?.delivery_days ?? null,
    recentComments: (comments ?? [])
      .filter((c) => !c.is_internal)
      .map((c) => c.body)
      .filter((s): s is string => typeof s === "string"),
  };

  const brandCtx: BrandContext | undefined = brand
    ? {
        brandName: brand.brand_name,
        brandColors: brand.brand_colors,
        referenceSites: brand.reference_sites,
        tone: brand.tone,
        forbiddenExpressions: brand.forbidden_expressions,
        goToPhrases: brand.go_to_phrases,
        notes: brand.notes,
      }
    : undefined;

  return {
    ok: true,
    project: projectCtx,
    brand: brandCtx,
    organizationId: project.organization_id,
    ownerUserId: project.user_id,
  };
}

async function loadQuoteContext(quoteId: string): Promise<{
  ok: boolean;
  project?: ProjectContext;
  brand?: BrandContext;
  organizationId?: string | null;
  ownerUserId?: string | null;
  error?: string;
}> {
  const admin = createAdminSupabase();
  const { data: quote } = await admin
    .from("quotes")
    .select(
      "id,title,service_type,service_id,user_id,inquiry_id,organization_id,notes,delivery_days,total_price,base_price,options",
    )
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return { ok: false, error: "견적을 찾을 수 없습니다" };

  const [{ data: inquiry }, { data: brand }, { data: service }] = await Promise.all([
    quote.inquiry_id
      ? admin
          .from("inquiries")
          .select("name,company,message,budget_range")
          .eq("id", quote.inquiry_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    quote.user_id
      ? admin
          .from("brand_profiles")
          .select("*")
          .eq("user_id", quote.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    quote.service_id
      ? admin
          .from("services")
          .select("key,name,name_en")
          .eq("id", quote.service_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const projectCtx: ProjectContext = {
    title: quote.title,
    serviceType: quote.service_type,
    serviceKey: service?.key ?? null,
    description: quote.notes ?? null,
    inquiryMessage: inquiry?.message ?? null,
    customerName: inquiry?.name ?? null,
    companyName: inquiry?.company ?? null,
    budget: inquiry?.budget_range ?? null,
    deliveryDays: quote.delivery_days ?? null,
    recentComments: [],
  };

  const brandCtx: BrandContext | undefined = brand
    ? {
        brandName: brand.brand_name,
        brandColors: brand.brand_colors,
        referenceSites: brand.reference_sites,
        tone: brand.tone,
        forbiddenExpressions: brand.forbidden_expressions,
        goToPhrases: brand.go_to_phrases,
        notes: brand.notes,
      }
    : undefined;

  return {
    ok: true,
    project: projectCtx,
    brand: brandCtx,
    organizationId: quote.organization_id,
    ownerUserId: quote.user_id,
  };
}

async function saveAsset(input: {
  projectId?: string | null;
  quoteId?: string | null;
  organizationId?: string | null;
  userId: string;
  kind: AIAssetKind;
  prompt: string;
  output: string;
  provider: string;
  model: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("ai_assets")
    .insert({
      project_id: input.projectId ?? null,
      quote_id: input.quoteId ?? null,
      organization_id: input.organizationId ?? null,
      user_id: input.userId,
      kind: input.kind,
      prompt: input.prompt,
      output: input.output,
      provider: input.provider,
      model: input.model,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();
  if (error) {
    console.error("[ai] saveAsset failed", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function generateBriefAction(projectId: string) {
  const me = await requireStaff();
  const ctx = await loadContext(projectId);
  if (!ctx.ok || !ctx.project) {
    return { ok: false as const, error: ctx.error ?? "context load failed" };
  }
  const rendered = renderBriefPrompt({
    project: ctx.project,
    brand: ctx.brand,
  });
  const provider = getAIProvider();
  const result = await provider.generateText({
    system: rendered.system,
    prompt: rendered.prompt,
    maxTokens: 1800,
    temperature: 0.6,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  const assetId = await saveAsset({
    projectId,
    organizationId: ctx.organizationId,
    userId: me.id,
    kind: "brief",
    prompt: rendered.prompt,
    output: result.text,
    provider: result.provider,
    model: result.model,
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "ai_brief_generated",
    metadata: { provider: result.provider, model: result.model, asset_id: assetId },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return {
    ok: true as const,
    text: result.text,
    provider: result.provider,
    model: result.model,
    assetId,
  };
}

export async function generateCopyAction(
  projectId: string,
  kind: "copy" | "headline" | "cta" | "description",
  hint?: string,
) {
  const me = await requireStaff();
  const ctx = await loadContext(projectId);
  if (!ctx.ok || !ctx.project) {
    return { ok: false as const, error: ctx.error ?? "context load failed" };
  }
  const rendered = renderCopyPrompt({
    kind,
    project: ctx.project,
    brand: ctx.brand,
    hint,
  });
  const provider = getAIProvider();
  const result = await provider.generateText({
    system: rendered.system,
    prompt: rendered.prompt,
    maxTokens: 700,
    temperature: 0.8,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  const assetId = await saveAsset({
    projectId,
    organizationId: ctx.organizationId,
    userId: me.id,
    kind,
    prompt: rendered.prompt,
    output: result.text,
    provider: result.provider,
    model: result.model,
    metadata: hint ? { hint } : {},
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "ai_copy_generated",
    metadata: { kind, provider: result.provider, model: result.model, asset_id: assetId },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return {
    ok: true as const,
    text: result.text,
    provider: result.provider,
    model: result.model,
    assetId,
  };
}

export async function generateDesignPromptAction(
  projectId: string,
  hint?: string,
) {
  const me = await requireStaff();
  const ctx = await loadContext(projectId);
  if (!ctx.ok || !ctx.project) {
    return { ok: false as const, error: ctx.error ?? "context load failed" };
  }
  const rendered = renderDesignPrompt({
    project: ctx.project,
    brand: ctx.brand,
    hint,
  });
  const provider = getAIProvider();
  const result = await provider.generateText({
    system: rendered.system,
    prompt: rendered.prompt,
    maxTokens: 900,
    temperature: 0.85,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  const assetId = await saveAsset({
    projectId,
    organizationId: ctx.organizationId,
    userId: me.id,
    kind: "design_prompt",
    prompt: rendered.prompt,
    output: result.text,
    provider: result.provider,
    model: result.model,
    metadata: hint ? { hint } : {},
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "project",
    entity_id: projectId,
    action: "ai_design_prompt_generated",
    metadata: { provider: result.provider, model: result.model, asset_id: assetId },
  });

  revalidatePath(`/admin/projects/${projectId}`);
  return {
    ok: true as const,
    text: result.text,
    provider: result.provider,
    model: result.model,
    assetId,
  };
}

export async function generateQuoteBriefAction(quoteId: string) {
  const me = await requireStaff();
  const ctx = await loadQuoteContext(quoteId);
  if (!ctx.ok || !ctx.project) {
    return { ok: false as const, error: ctx.error ?? "context load failed" };
  }
  const rendered = renderBriefPrompt({
    project: ctx.project,
    brand: ctx.brand,
  });
  const provider = getAIProvider();
  const result = await provider.generateText({
    system: rendered.system,
    prompt: rendered.prompt,
    maxTokens: 1800,
    temperature: 0.6,
  });
  if (!result.ok) return { ok: false as const, error: result.error };

  const assetId = await saveAsset({
    quoteId,
    organizationId: ctx.organizationId,
    userId: me.id,
    kind: "brief",
    prompt: rendered.prompt,
    output: result.text,
    provider: result.provider,
    model: result.model,
  });

  await logActivity({
    actor_id: me.id,
    entity_type: "quote",
    entity_id: quoteId,
    action: "ai_brief_generated",
    metadata: { provider: result.provider, model: result.model, asset_id: assetId },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/brief`);
  return {
    ok: true as const,
    text: result.text,
    provider: result.provider,
    model: result.model,
    assetId,
  };
}

import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(80),
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
  phone: z
    .string()
    .max(40)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  company: z
    .string()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  service_type: z.string().max(80).optional(),
  budget_range: z.string().max(80).optional(),
  message: z.string().max(4000).optional(),
  // honeypot
  website: z.string().max(0).optional().default(""),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const quoteOptionSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  price: z.number().int().nonnegative(),
});

export const quoteSchema = z.object({
  inquiry_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(160),
  service_type: z.string().max(80).optional().nullable(),
  base_price: z.number().int().nonnegative(),
  options: z.array(quoteOptionSchema).default([]),
  delivery_days: z.number().int().min(1).max(120).default(5),
  status: z
    .enum(["draft", "sent", "accepted", "rejected", "expired"])
    .default("draft"),
  expires_at: z.string().datetime().nullable().optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export const projectSchema = z.object({
  client_name: z.string().min(1).max(160),
  company: z.string().max(160).optional().nullable(),
  title: z.string().min(1).max(200),
  service_type: z.string().max(80).optional().nullable(),
  status: z
    .enum([
      "queued",
      "briefing",
      "ai_draft",
      "designing",
      "review",
      "revision",
      "delivered",
      "completed",
      "cancelled",
    ])
    .default("queued"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  progress: z.number().int().min(0).max(100).default(0),
  due_date: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

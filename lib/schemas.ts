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

// Public login allows email OR username
export const publicLoginSchema = z.object({
  identifier: z.string().min(1, "이메일 또는 아이디를 입력해주세요").max(120),
  password: z.string().min(6, "비밀번호는 6자 이상 입력해주세요"),
});

export type PublicLoginInput = z.infer<typeof publicLoginSchema>;

const usernameRule = z
  .string()
  .min(4, "아이디는 4자 이상")
  .max(40, "아이디는 40자 이하")
  .regex(/^[a-zA-Z0-9_.-]+$/, "영문/숫자/._- 만 사용");

const passwordRule = z.string().min(8, "비밀번호는 8자 이상").max(72);

const baseSignupShape = {
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
  username: usernameRule,
  password: passwordRule,
  password_confirm: z.string(),
  agree: z
    .boolean()
    .refine((v) => v === true, "이용약관에 동의해주세요"),
  website: z.string().max(0).optional().default(""), // honeypot
};

export const individualSignupSchema = z
  .object({
    ...baseSignupShape,
    name: z.string().min(1, "이름을 입력해주세요").max(60),
    phone: z.string().min(8, "전화번호를 정확히 입력해주세요").max(20),
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식으로 입력해주세요"),
    address: z.string().min(2, "주소를 입력해주세요").max(200),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.password_confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password_confirm"],
        message: "비밀번호가 일치하지 않습니다",
      });
    }
  });

export type IndividualSignupInput = z.infer<typeof individualSignupSchema>;

export const businessSignupSchema = z
  .object({
    ...baseSignupShape,
    company_name: z.string().min(1, "상호명을 입력해주세요").max(120),
    representative_name: z.string().min(1, "대표자명을 입력해주세요").max(60),
    business_registration_number: z
      .string()
      .regex(
        /^\d{3}-?\d{2}-?\d{5}$/,
        "사업자등록번호는 000-00-00000 형식으로 입력해주세요",
      ),
    contact_name: z.string().min(1, "담당자 이름을 입력해주세요").max(60),
    contact_phone: z.string().min(8, "담당자 전화번호를 정확히 입력해주세요").max(20),
    business_address: z.string().min(2, "사업장 주소를 입력해주세요").max(200),
    industry: z.string().min(1, "업종을 입력해주세요").max(80),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.password_confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password_confirm"],
        message: "비밀번호가 일치하지 않습니다",
      });
    }
  });

export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;

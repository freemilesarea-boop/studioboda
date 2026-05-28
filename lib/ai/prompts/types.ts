export type BrandContext = {
  brandName?: string | null;
  brandColors?: string | null;
  referenceSites?: string | null;
  tone?: string | null;
  forbiddenExpressions?: string | null;
  goToPhrases?: string | null;
  notes?: string | null;
};

export type ProjectContext = {
  title: string;
  serviceType?: string | null;
  serviceKey?: string | null;
  description?: string | null;
  inquiryMessage?: string | null;
  customerName?: string | null;
  companyName?: string | null;
  budget?: string | null;
  deliveryDays?: number | null;
  recentComments?: string[];
};

export type Rendered = { system: string; prompt: string };

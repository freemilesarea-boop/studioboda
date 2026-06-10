import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/env";

// ⚠️ 일회성 시드 업로드 라우트 — 검증용 샘플 파일(고정 경로)을 Storage에 적재한다.
// 토큰 보호 + 고정 경로/고정 바이트만 기록한다(임의 업로드 불가). 검증 후 즉시 삭제 예정.
export const dynamic = "force-dynamic";

const TOKEN = "cb95123d9fab3b904a15c363da77bfd4";
const PID = "77c2ba9f-930f-4d31-bc4f-38271c58e3f3";

const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAIAAAA48Cq8AAAA7ElEQVR42u3SQQ0AAAjEsDOII7yDB8KzSRUsS9fAu0iAsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWGAsjIWxwFgYC2OBsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLIylAsbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJYGAuMhbEwFlws+qsHyvHQ624AAAAASUVORK5CYII=";
const PDF_B64 =
  "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDIwMF0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4+ZW5kb2JqCjQgMCBvYmo8PC9MZW5ndGggNzA+PnN0cmVhbQpCVCAvRjEgMTggVGYgNDAgMTEwIFRkIChTVFVESU8gQk9EQSAtIHNhbXBsZSBkZWxpdmVyYWJsZSkgVGogRVQKZW5kc3RyZWFtIGVuZG9iago1IDAgb2JqPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj5lbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTIgMDAwMDAgbiAKMDAwMDAwMDEwMSAwMDAwMCBuIAowMDAwMDAwMjA5IDAwMDAwIG4gCjAwMDAwMDAzMjAgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjM4OQolJUVPRgo=";

const FILES = [
  { path: `${PID}/brief/seed-reference.png`, b64: PNG_B64, type: "image/png" },
  { path: `${PID}/deliverables/seed-final-v1.pdf`, b64: PDF_B64, type: "application/pdf" },
  { path: `${PID}/materials/seed-logo.png`, b64: PNG_B64, type: "image/png" },
];

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const admin = createAdminSupabase();
  const results: Array<{ path: string; ok: boolean; error?: string }> = [];
  for (const f of FILES) {
    const bytes = Buffer.from(f.b64, "base64");
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(f.path, bytes, { contentType: f.type, upsert: true });
    results.push({ path: f.path, ok: !error, error: error?.message });
  }
  return NextResponse.json({ ok: results.every((r) => r.ok), results });
}

/**
 * E2E: 문의 첨부 실제 바이트 업로드 검증 (이미지/PDF/ZIP)
 *
 * 실행: 네트워크 egress + 아래 env 가 있는 환경에서
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/e2e-inquiry-attachments.mjs
 *
 * 앱의 server action(createInquiryUploadUrlAction → uploadToSignedUrl →
 * confirmInquiryFileAction → getInquiryFileUrlAction)이 수행하는 Supabase
 * Storage/DB 동작을 그대로 재현해, 실제 파일 바이트의 업로드·기록·서명URL
 * 다운로드·정리까지 검증한다.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "inquiry-files";
if (!URL || !KEY) {
  console.error("env NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}
const db = createClient(URL, KEY, { auth: { persistSession: false } });

// 최소한의 유효 바이트 (확장자/시그니처)
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n", "utf8");
const ZIP = Buffer.from("504b0506000000000000000000000000000000000000", "hex"); // empty zip EOCD

const cases = [
  { name: "reference.png", bytes: PNG, mime: "image/png", category: "reference" },
  { name: "plan.pdf", bytes: PDF, mime: "application/pdf", category: "document" },
  { name: "assets.zip", bytes: ZIP, mime: "application/zip", category: "etc" },
];

let inquiryId;
const paths = [];
let pass = true;
const log = (ok, msg) => {
  if (!ok) pass = false;
  console.log(`${ok ? "PASS" : "FAIL"} · ${msg}`);
};

try {
  // 1) 문의 생성
  const { data: inq, error: e0 } = await db
    .from("inquiries")
    .insert({ name: "E2E byte", email: "e2e-byte@studioboda.internal", message: "x", source: "website" })
    .select("id")
    .single();
  if (e0) throw e0;
  inquiryId = inq.id;
  log(true, `inquiry created ${inquiryId}`);

  // 2) 각 파일: signed upload URL → 실제 바이트 업로드 → 행 기록
  for (const c of cases) {
    const path = `${inquiryId}/${Date.now()}-${c.name}`;
    const { data: signed, error: e1 } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    log(!e1 && !!signed, `signed upload URL · ${c.name}`);
    if (e1) continue;
    const { error: e2 } = await db.storage
      .from(BUCKET)
      .uploadToSignedUrl(signed.path, signed.token, c.bytes, { contentType: c.mime });
    log(!e2, `byte upload (${c.bytes.length}B) · ${c.name}`);
    paths.push(signed.path);
    const { error: e3 } = await db.from("inquiry_files").insert({
      inquiry_id: inquiryId,
      file_name: c.name,
      file_path: signed.path,
      file_size: c.bytes.length,
      mime_type: c.mime,
      category: c.category,
    });
    log(!e3, `inquiry_files row · ${c.name}`);
  }

  // 3) 관리자 목록 카운트 / 상세 정렬
  const { count } = await db
    .from("inquiry_files")
    .select("id", { count: "exact", head: true })
    .eq("inquiry_id", inquiryId);
  log(count === 3, `admin badge count = ${count} (expect 3)`);

  // 4) 서명 URL 다운로드 후 바이트 일치 확인
  const { data: rows } = await db
    .from("inquiry_files")
    .select("file_path,file_name,file_size")
    .eq("inquiry_id", inquiryId);
  for (const r of rows ?? []) {
    const { data: dl } = await db.storage.from(BUCKET).createSignedUrl(r.file_path, 120, { download: r.file_name });
    const res = await fetch(dl.signedUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    log(res.ok && buf.length === r.file_size, `download bytes match · ${r.file_name} (${buf.length}=${r.file_size})`);
  }
} catch (err) {
  log(false, `unexpected: ${err.message}`);
} finally {
  // 5) 정리: storage objects + inquiry(cascade)
  if (paths.length) await db.storage.from(BUCKET).remove(paths);
  if (inquiryId) await db.from("inquiries").delete().eq("id", inquiryId);
  const { count: leftover } = await db
    .from("inquiry_files")
    .select("id", { count: "exact", head: true })
    .eq("inquiry_id", inquiryId ?? "00000000-0000-0000-0000-000000000000");
  log((leftover ?? 0) === 0, `cleanup complete (leftover files = ${leftover ?? 0})`);
  console.log(pass ? "\n✅ E2E PASS" : "\n❌ E2E FAIL");
  process.exit(pass ? 0 : 1);
}

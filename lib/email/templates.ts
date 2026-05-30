// Email templates — keep inline (no JSX) for simplicity. All templates share
// the same brand wrapper for consistent BODA tone.

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

function wrapper(title: string, body: string, ctaLabel?: string, ctaHref?: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F6F6FA;font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#0A0A12;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F6FA;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #E6E6EC;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0;">
                <div style="font-family:'Pretendard Variable',Pretendard,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6E5BFF;">STUDIO BODA</div>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;letter-spacing:-.03em;color:#0A0A12;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-size:14px;line-height:1.7;color:#494956;">
                ${body}
              </td>
            </tr>
            ${
              ctaLabel && ctaHref
                ? `<tr><td style="padding:24px 32px 0;">
                    <a href="${escapeAttr(ctaHref)}" style="display:inline-block;background:#6E5BFF;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:13px;letter-spacing:-.01em;">${escapeHtml(ctaLabel)} →</a>
                  </td></tr>`
                : ""
            }
            <tr>
              <td style="padding:28px 32px 32px;font-size:11px;color:#7E7E8C;border-top:1px solid #E6E6EC;margin-top:24px;">
                © 2026 STUDIO BODA · 스튜디오 보다 · <a href="mailto:hello@studioboda.kr" style="color:#6E5BFF;text-decoration:none;">hello@studioboda.kr</a>
              </td>
            </tr>
          </table>
          <div style="margin-top:16px;font-size:10px;color:#7E7E8C;font-family:'Pretendard Variable',sans-serif;">본 메일은 STUDIO BODA 운영 알림으로 발송되었습니다.</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

// ───────────── individual templates ─────────────

export type WelcomeData = { name: string; siteUrl: string };
export const welcome = (d: WelcomeData) => ({
  subject: `${d.name}님, STUDIO BODA 가입을 환영합니다`,
  html: wrapper(
    "STUDIO BODA에 오신 것을 환영합니다",
    `<p>안녕하세요 <b>${escapeHtml(d.name)}</b>님,<br />가입을 환영합니다. AI 자동화 + 시니어 디렉터 큐레이션으로 빠르고 감각적인 콘텐츠를 만들어드립니다.</p>
     <p>새 견적은 메인의 견적 폼이나 마이페이지에서 시작할 수 있습니다.</p>`,
    "마이페이지로 이동",
    `${d.siteUrl}/me`,
  ),
});

export type QuoteReceivedData = {
  name: string;
  quoteTitle: string;
  totalPrice: number;
  deliveryDays: number;
  quoteUrl: string;
};
export const quoteReceived = (d: QuoteReceivedData) => ({
  subject: `[STUDIO BODA] 견적이 발행되었습니다 · ${d.quoteTitle}`,
  html: wrapper(
    "새 견적이 발행되었습니다",
    `<p><b>${escapeHtml(d.name)}</b>님, 운영팀이 견적을 발행했습니다.</p>
     <ul style="padding-left:18px;margin:12px 0;">
       <li>제목: <b>${escapeHtml(d.quoteTitle)}</b></li>
       <li>합계: <b style="color:#0A0A12;">${fmt(d.totalPrice)}원</b> <span style="color:#7E7E8C;">(VAT 별도)</span></li>
       <li>납기: ${d.deliveryDays}일</li>
     </ul>
     <p>견적 내역을 확인하고 수락 또는 거절해주세요.</p>`,
    "견적 보기",
    d.quoteUrl,
  ),
});

export type PaymentRequestedData = {
  name: string;
  paymentTitle: string;
  amount: number;
  payUrl: string;
};
export const paymentRequested = (d: PaymentRequestedData) => ({
  subject: `[STUDIO BODA] 결제 요청 · ${d.paymentTitle}`,
  html: wrapper(
    "결제가 요청되었습니다",
    `<p><b>${escapeHtml(d.name)}</b>님, 결제 청구가 발행되었습니다.</p>
     <ul style="padding-left:18px;margin:12px 0;">
       <li>항목: <b>${escapeHtml(d.paymentTitle)}</b></li>
       <li>금액: <b style="color:#0A0A12;">${fmt(d.amount)}원</b></li>
     </ul>
     <p>아래 버튼을 누르면 PayApp 결제창이 열립니다.</p>`,
    "결제하기",
    d.payUrl,
  ),
});

export type PaymentPaidData = {
  name: string;
  paymentTitle: string;
  amount: number;
  meUrl: string;
};
export const paymentPaid = (d: PaymentPaidData) => ({
  subject: `[STUDIO BODA] 결제가 완료되었습니다 · ${d.paymentTitle}`,
  html: wrapper(
    "결제가 정상 완료되었습니다",
    `<p><b>${escapeHtml(d.name)}</b>님, ${escapeHtml(d.paymentTitle)} 결제 (<b>${fmt(d.amount)}원</b>)가 완료되었습니다. 운영팀이 다음 단계를 진행합니다.</p>`,
    "내 프로젝트 보기",
    d.meUrl,
  ),
});

export type ProjectDeliveredData = {
  name: string;
  projectTitle: string;
  projectUrl: string;
};
export const projectDelivered = (d: ProjectDeliveredData) => ({
  subject: `[STUDIO BODA] 산출물이 전달되었습니다 · ${d.projectTitle}`,
  html: wrapper(
    "최종 산출물 전달",
    `<p><b>${escapeHtml(d.name)}</b>님, <b>${escapeHtml(d.projectTitle)}</b> 산출물을 전달했습니다.<br />마이페이지의 프로젝트 상세에서 최종 파일을 다운로드하실 수 있습니다.</p>`,
    "프로젝트 보기",
    d.projectUrl,
  ),
});

export type ContractSentData = {
  name: string;
  contractTitle: string;
  amount: number;
  depositAmount: number;
  balanceAmount: number;
  contractUrl: string;
  payUrl?: string | null; // 예약금 결제 링크 (미결제 시에만)
};
export const contractSent = (d: ContractSentData) => ({
  subject: `[STUDIO BODA] 전자계약서와 예약금 안내 · ${d.contractTitle}`,
  html: wrapper(
    "전자계약서 검토 · 서명 · 예약금 안내",
    `<p><b>${escapeHtml(d.name)}</b>님, 전자계약서를 보내드립니다. 계약 내용을 검토하고 전자서명해주세요.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;border:1px solid #E6E6EC;border-radius:12px;overflow:hidden;font-size:13px;">
       <tr><td style="padding:10px 14px;background:#F6F6FA;color:#7E7E8C;">계약</td><td style="padding:10px 14px;text-align:right;font-weight:700;">${escapeHtml(d.contractTitle)}</td></tr>
       <tr><td style="padding:10px 14px;color:#7E7E8C;border-top:1px solid #E6E6EC;">총 계약금액</td><td style="padding:10px 14px;text-align:right;font-weight:700;border-top:1px solid #E6E6EC;">${fmt(d.amount)}원 <span style="color:#7E7E8C;font-weight:400;">(VAT 별도)</span></td></tr>
       <tr><td style="padding:10px 14px;color:#7E7E8C;border-top:1px solid #E6E6EC;">예약금 (30%)</td><td style="padding:10px 14px;text-align:right;font-weight:700;color:#6E5BFF;border-top:1px solid #E6E6EC;">${fmt(d.depositAmount)}원</td></tr>
       <tr><td style="padding:10px 14px;color:#7E7E8C;border-top:1px solid #E6E6EC;">잔금 (70%)</td><td style="padding:10px 14px;text-align:right;font-weight:700;border-top:1px solid #E6E6EC;">${fmt(d.balanceAmount)}원</td></tr>
     </table>
     <div style="margin:12px 0;padding:12px 14px;background:#FFF7ED;border:1px solid #F59E0B33;border-radius:10px;font-size:12.5px;color:#494956;">
       <b style="color:#0A0A12;">예약금 환불 불가 안내</b><br/>
       예약금은 착수금의 성격으로, 계약 체결 및 결제 완료 후 단순 변심·취향 불일치·본결제 미진행·계약 취소 사유가 발생하더라도 환불되지 않습니다. 자세한 내용은 계약서 조항을 확인해주세요.
     </div>
     ${
       d.payUrl
         ? `<p style="margin:14px 0 0;">계약 검토 후 아래 버튼으로 예약금을 결제하시면 제작이 착수됩니다.</p>
            <p style="margin:10px 0 0;"><a href="${escapeAttr(d.payUrl)}" style="display:inline-block;background:#0A0A12;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:13px;">예약금 ${fmt(d.depositAmount)}원 결제하기 →</a></p>`
         : ""
     }
     <p style="margin:14px 0 0;color:#7E7E8C;font-size:12px;">로그인 후 마이페이지 &gt; 계약서에서도 확인할 수 있습니다.</p>`,
    "계약서 검토 및 서명",
    d.contractUrl,
  ),
});

// ───────────── render dispatcher ─────────────

export type TemplateMap = {
  welcome: WelcomeData;
  quote_received: QuoteReceivedData;
  payment_requested: PaymentRequestedData;
  payment_paid: PaymentPaidData;
  project_delivered: ProjectDeliveredData;
  contract_sent: ContractSentData;
};
export type TemplateName = keyof TemplateMap;

export function renderTemplate<T extends TemplateName>(
  name: T,
  data: TemplateMap[T],
): { subject: string; html: string } {
  switch (name) {
    case "welcome":
      return welcome(data as WelcomeData);
    case "quote_received":
      return quoteReceived(data as QuoteReceivedData);
    case "payment_requested":
      return paymentRequested(data as PaymentRequestedData);
    case "payment_paid":
      return paymentPaid(data as PaymentPaidData);
    case "project_delivered":
      return projectDelivered(data as ProjectDeliveredData);
    case "contract_sent":
      return contractSent(data as ContractSentData);
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown template: ${String(_exhaustive)}`);
    }
  }
}

// ============================================================================
// ⚠️ READ-ONLY BACKUP — DO NOT DEPLOY FROM THIS REPO ⚠️
// ============================================================================
// This is a verbatim backup of the PayApp common-notification router Edge
// Function that fronts STUDIO BODA's payment webhook. It does NOT live in this
// repo's Supabase project and is NOT deployed from here.
//
//   Source Supabase project : tyrhbiwvwmdybwaydvto  ("louver-ai-platform")
//   Function slug           : payapp-webhook
//   Captured version        : v38  (updated 2026-06-01)
//   verify_jwt              : false (public — PayApp posts without a JWT)
//   Captured at             : 2026-06-09 (Phase F1 documentation)
//
// The PayApp merchant account is SHARED across multiple sites (studioboda /
// program / ebook); this single function routes by `var1`. For STUDIO BODA it
// forwards the raw payload to https://www.studioboda.co.kr/api/payapp/webhook
// (apex→www rewrite is the v38 fix that stopped POST-body loss on 307).
//
// To restore/modify the real function you MUST do it in the louver-ai-platform
// Supabase project (supabase functions deploy payapp-webhook), NOT here.
// See docs/PAYAPP_WEBHOOK_ARCHITECTURE.md.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * PayApp feedbackurl (웹훅) 멀티 사이트 라우터 (v38)
 *
 * v38 핵심 수정: STUDIO BODA forward 대상을 항상 redirect/protection이
 * 없는 canonical 호스트(www.studioboda.co.kr)의 /api/payapp/webhook 경로로
 * 강제한다. apex studioboda.co.kr 은 www로 307 리다이렉트되며 POST
 * body가 유실되어 결제완료가 반영되지 않던 근본 원인을 제거.
 * 우선 STUDIOBODA_WEBHOOK_URL 시크릿을 사용하되, 호스트가 apex이면 www로
 * 교체하고 경로는 항상 /api/payapp/webhook 로 정규화한다.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FALLBACK_WEBHOOK = 'https://www.studioboda.co.kr/api/payapp/webhook'

async function verifyPayAppRequest(payload: Record<string, string>): Promise<boolean> {
  const linkKey = Deno.env.get('PAYAPP_LINK_KEY')
  const linkValue = Deno.env.get('PAYAPP_LINK_VALUE')
  if (!linkKey || !linkValue) {
    console.error('[PayApp Webhook] CRITICAL: PAYAPP_LINK_KEY/VALUE 미설정')
    return true
  }
  const receivedKey = payload.link_key || payload.linkkey || ''
  const receivedVal = payload.link_val || payload.linkval || ''
  if (receivedKey && receivedKey !== linkKey) return false
  if (receivedVal && receivedVal !== linkValue) return false
  return true
}

/**
 * Resolve the forward URL: use the secret if present, else fallback. ALWAYS
 * rewrite an apex studioboda.co.kr host to www (apex 307-redirects → POST lost),
 * and force the path to /api/payapp/webhook.
 */
function resolveWebhookUrl(): string {
  const raw = (Deno.env.get('STUDIOBODA_WEBHOOK_URL') || '').trim()
  let u: URL
  try {
    u = new URL(raw || FALLBACK_WEBHOOK)
  } catch {
    try { u = new URL(`https://${raw.replace(/^https?:\/\//,'').replace(/\/.*$/,'')}`) }
    catch { return FALLBACK_WEBHOOK }
  }
  // apex → www (redirect-proof)
  if (u.hostname === 'studioboda.co.kr') u.hostname = 'www.studioboda.co.kr'
  u.pathname = '/api/payapp/webhook'
  u.search = ''
  u.hash = ''
  return u.toString()
}

async function forwardToStudioBoda(rawPayload: Record<string, string>): Promise<{status:number, body:string}> {
  const url = resolveWebhookUrl()
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(rawPayload)) body.set(k, String(v ?? ''))
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      redirect: 'manual', // never silently downgrade a 307 to GET
    })
    const text = await res.text().catch(() => '')
    console.log(`[PayApp Router] forward → ${url} status=${res.status} body=${text.slice(0,120)}`)
    return { status: res.status, body: text.slice(0,200) }
  } catch (err) {
    console.error('[PayApp Router] forward failed:', err)
    return { status: 0, body: String(err) }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  let rawPayload: Record<string, string> = {}
  try {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/x-www-form-urlencoded')) {
      const fd = await req.formData()
      for (const [k, v] of fd.entries()) rawPayload[k] = String(v)
    } else if (ct.includes('application/json')) {
      rawPayload = await req.json()
    } else {
      const text = await req.text()
      for (const [k, v] of new URLSearchParams(text).entries()) rawPayload[k] = v
    }

    if (!(await verifyPayAppRequest(rawPayload))) {
      await supabase.from('payment_logs').insert({ event_type: 'verification_failed', raw_payload: rawPayload, error_message: 'link verification failed', processed: true })
      return new Response('FAIL', { status: 403, headers: corsHeaders })
    }

    const routeTag = (rawPayload.var1 || '').toString().toLowerCase()
    if (routeTag === 'studioboda' || routeTag === 'studioboda_payment') {
      const fwd = await forwardToStudioBoda(rawPayload)
      try {
        await supabase.from('payment_logs').insert({
          event_type: 'studioboda_forwarded',
          pay_state: rawPayload.pay_state || rawPayload.state || null,
          mul_no: rawPayload.mul_no || null,
          raw_payload: rawPayload,
          processed: true,
          error_message: fwd.status === 200 ? null : `forward status=${fwd.status} ${fwd.body}`,
        })
      } catch (_) { /* ignore */ }
      return new Response('SUCCESS', { headers: corsHeaders })
    }

    // ===== legacy subscription_orders handling (unchanged) =====
    const payState = rawPayload.pay_state || rawPayload.state || ''
    const mulNo = rawPayload.mul_no || ''
    const rebillNo = rawPayload.rebill_no || ''
    const orderId = rawPayload.var1 || ''
    const orderType = rawPayload.var2 || ''
    if (orderType === 'ebook') return new Response('SUCCESS', { headers: corsHeaders })

    const logEntry = { order_id: null as string | null, event_type: `payapp_state_${payState}`, pay_state: payState, mul_no: mulNo || null, rebill_no: rebillNo || null, raw_payload: rawPayload, processed: false, error_message: null as string | null, user_id: null as string | null }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isValidUUID = orderId && uuidRegex.test(orderId)
    let order: any = null
    if (isValidUUID) {
      const { data } = await supabase.from('subscription_orders').select('*').eq('id', orderId).single()
      order = data
      if (order) { logEntry.user_id = order.user_id; logEntry.order_id = orderId }
    }
    const { data: logData } = await supabase.from('payment_logs').insert(logEntry).select('id').single()
    const logId = logData?.id
    if (!order) {
      if (logId) await supabase.from('payment_logs').update({ error_message: 'Order not found', processed: true }).eq('id', logId)
      return new Response('SUCCESS', { headers: corsHeaders })
    }
    const userId = order.user_id
    const planType = order.plan_type
    switch (payState) {
      case '4': {
        await supabase.from('subscription_orders').update({ status: 'paid', payapp_mul_no: mulNo, payapp_rebill_no: rebillNo }).eq('id', orderId)
        const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('user_id', userId).eq('status', 'active').single()
        if (existingSub) {
          await supabase.from('subscriptions').update({ plan_type: planType, order_id: orderId, payapp_rebill_no: rebillNo, next_billing_date: getNextBillingDate() }).eq('id', existingSub.id)
        } else {
          await supabase.from('subscriptions').insert({ user_id: userId, order_id: orderId, plan_type: planType, status: 'active', payapp_rebill_no: rebillNo, started_at: new Date().toISOString(), next_billing_date: getNextBillingDate() })
        }
        await supabase.from('profiles').update({ membership: 'premium' }).eq('id', userId)
        if (logId) await supabase.from('payment_logs').update({ processed: true }).eq('id', logId)
        break
      }
      case '64': case '128': {
        await supabase.from('subscription_orders').update({ status: 'cancelled' }).eq('id', orderId)
        const { data: activeSub } = await supabase.from('subscriptions').select('id').eq('user_id', userId).eq('status', 'active').single()
        if (activeSub) await supabase.from('subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', activeSub.id)
        const { data: cp } = await supabase.from('profiles').select('membership').eq('id', userId).single()
        if (cp?.membership !== 'cohort') await supabase.from('profiles').update({ membership: 'free' }).eq('id', userId)
        if (logId) await supabase.from('payment_logs').update({ processed: true }).eq('id', logId)
        break
      }
      case '99': {
        await supabase.from('subscription_orders').update({ status: 'failed' }).eq('id', orderId)
        const { data: fs } = await supabase.from('subscriptions').select('id').eq('user_id', userId).eq('status', 'active').single()
        if (fs) await supabase.from('subscriptions').update({ status: 'failed' }).eq('id', fs.id)
        const { data: cp } = await supabase.from('profiles').select('membership').eq('id', userId).single()
        if (cp?.membership !== 'cohort') await supabase.from('profiles').update({ membership: 'free' }).eq('id', userId)
        if (logId) await supabase.from('payment_logs').update({ processed: true, error_message: rawPayload.ResultMsg || 'Recurring payment failed' }).eq('id', logId)
        break
      }
      default: {
        if (logId) await supabase.from('payment_logs').update({ processed: true }).eq('id', logId)
        break
      }
    }
    return new Response('SUCCESS', { headers: corsHeaders })
  } catch (err) {
    try { await supabase.from('payment_logs').insert({ event_type: 'webhook_error', raw_payload: rawPayload, error_message: err instanceof Error ? err.message : String(err), processed: false }) } catch (_) {}
    return new Response('SUCCESS', { headers: corsHeaders })
  }
})

function getNextBillingDate(fromDate?: Date): string {
  const base = fromDate ?? new Date()
  const originalDay = base.getDate()
  const next = new Date(base)
  next.setDate(1); next.setMonth(next.getMonth() + 1)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(originalDay, lastDay))
  return next.toISOString()
}

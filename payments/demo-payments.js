/**
 * DEMO payments — zero backend. Replace placeholders below when wiring to real gateways.
 * Vanilla JS, safe to inline into Lovable code blocks.
 */

const DEMO_MODE = true; // TODO: set false when going live with real server APIs
const TOYYIB_BILLCODE = "YOUR_BILLCODE"; // TODO: your sandbox billcode
const SENANG_MERCHANT_ID = "YOUR_MERCHANT_ID"; // TODO: your sandbox merchant id
const RETURN_URL = "https://your-domain/thank-you"; // TODO: your thank-you URL
const CALLBACK_URL = "https://your-domain/payment-callback"; // optional for demo

export function getCartTotalMYR() {
  const el = document.querySelector('[data-cart-total]');
  const text = (el?.textContent || 'RM0.00').trim();
  const amt = Number(text.replace(/[^\d.]/g, '')) || 0;
  return { rm: amt.toFixed(2), sen: Math.round(amt * 100) };
}

function buildToyyibUrl(rm) {
  const p = new URLSearchParams({
    amount: rm,
    returnurl: RETURN_URL,
    callbackurl: CALLBACK_URL
  });
  // dev host for sandbox
  return `https://dev.toyyibpay.com/${TOYYIB_BILLCODE}?${p.toString()}`;
}

export function initDemoPayments(options = {}) {
  // ToyyibPay hosted bill
  const btnToyyib = document.querySelector('[data-pay-toyyib]');
  if (btnToyyib) {
    btnToyyib.addEventListener('click', () => {
      const { rm } = getCartTotalMYR();
      if (!TOYYIB_BILLCODE || TOYYIB_BILLCODE.includes('YOUR_')) {
        alert('Set TOYYIB_BILLCODE in payments/demo-payments.js'); return;
      }
      window.location.href = buildToyyibUrl(rm);
    });
  }

  // SenangPay hosted payment form POST
  const btnSenang = document.querySelector('[data-pay-senang]');
  const formSenang = document.getElementById('senangForm');
  if (btnSenang && formSenang) {
    btnSenang.addEventListener('click', () => {
      const { rm } = getCartTotalMYR();
      if (!SENANG_MERCHANT_ID || SENANG_MERCHANT_ID.includes('YOUR_')) {
        alert('Set SENANG_MERCHANT_ID in payments/demo-payments.js'); return;
      }
      const orderId = 'DEMO-' + Date.now();
      formSenang.action = `https://sandbox.senangpay.my/payment/${SENANG_MERCHANT_ID}`;
      formSenang.amount.value = rm;
      formSenang.order_id.value = orderId;
      // Optional: carry order id to return url
      const currentReturn = formSenang.dataset.returnUrl || RETURN_URL;
      try {
        const u = new URL(currentReturn);
        u.searchParams.set('order_id', orderId);
        formSenang.dataset.returnUrl = u.toString();
      } catch {}
      // LIVE ONLY (TODO): compute hash on server and inject before submit
      formSenang.submit();
    });
  }
}

// Auto-init when included directly at end of body
document.addEventListener('DOMContentLoaded', () => {
  try { if (typeof initDemoPayments === 'function') initDemoPayments(); } catch {}
});

/*
TODOs for PRODUCTION
- toyyibPay: Create bill per order via server API. Use exact amount and dynamic return/callback URLs. Store billCode/order in DB.
- senangPay: Compute MD5 hash server-side: md5(merchant_id + secret_key + amount + order_id + detail). Never expose secret key in client JS.
- Webhooks: Handle server-to-server callbacks to mark orders paid and send receipts.
- Security: Sanitize and log order_id, amount, payer info server-side.
*/



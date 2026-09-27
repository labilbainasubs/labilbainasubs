// Vercel serverless function (Node runtime).
// Takes a cart + fulfillment details + a card nonce from the Square Web
// Payments SDK, creates a Square Order, then charges it with a Square
// Payment. The Square Access Token never leaves this server — it's read
// from an environment variable, never sent to or stored in the browser.
//
// Required Vercel environment variables:
//   SQUARE_ACCESS_TOKEN  — secret, Sandbox or Production access token
//   SQUARE_LOCATION_ID   — the single shared location (4915 N Foster Rd)
//   SQUARE_ENV           — "sandbox" (default) or "production"

function squareBaseUrl(env) {
  return env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function randomIdempotencyKey() {
  // Square requires a unique key per order/payment attempt so retries
  // don't double-charge. crypto.randomUUID is available in the Vercel
  // Node runtime.
  return crypto.randomUUID();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
  const LOCATION_ID = process.env.SQUARE_LOCATION_ID;
  const SQUARE_ENV = process.env.SQUARE_ENV || "sandbox";

  if (!ACCESS_TOKEN || !LOCATION_ID) {
    return res.status(500).json({
      error: "Server is not configured — missing Square credentials. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in Vercel project settings.",
    });
  }

  const { sourceId, cart, fulfillment } = req.body || {};

  if (!sourceId) {
    return res.status(400).json({ error: "Missing card token (sourceId)." });
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  const base = squareBaseUrl(SQUARE_ENV);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Square-Version": "2025-01-23",
  };

  try {
    // ---- 1. Create the Order ----
    const lineItems = cart.map((item) => ({
      name: `${item.name} (${item.concept})`,
      quantity: String(item.qty),
      base_price_money: {
        amount: Math.round(item.price * 100),
        currency: "USD",
      },
    }));

    const fulfillments = [];
    if (fulfillment) {
      const recipient = {
        display_name: fulfillment.name || undefined,
        phone_number: fulfillment.phone || undefined,
        email_address: fulfillment.email || undefined,
      };
      if (fulfillment.type === "delivery") {
        fulfillments.push({
          type: "DELIVERY",
          delivery_details: {
            recipient: {
              ...recipient,
              address: fulfillment.address
                ? { address_line_1: fulfillment.address }
                : undefined,
            },
            deliver_at: fulfillment.pickupAtISO || undefined,
          },
        });
      } else {
        fulfillments.push({
          type: "PICKUP",
          pickup_details: {
            recipient,
            pickup_at: fulfillment.pickupAtISO || undefined,
          },
        });
      }
    }

    const orderRes = await fetch(`${base}/v2/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        idempotency_key: randomIdempotencyKey(),
        order: {
          location_id: LOCATION_ID,
          line_items: lineItems,
          fulfillments: fulfillments.length ? fulfillments : undefined,
        },
      }),
    });
    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      return res.status(orderRes.status).json({
        error: "Failed to create order",
        details: orderData.errors || orderData,
      });
    }

    const order = orderData.order;
    const amount = order.total_money;

    // ---- 2. Create the Payment against that Order ----
    const paymentRes = await fetch(`${base}/v2/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        idempotency_key: randomIdempotencyKey(),
        source_id: sourceId,
        amount_money: amount,
        order_id: order.id,
        location_id: LOCATION_ID,
        autocomplete: true,
      }),
    });
    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      return res.status(paymentRes.status).json({
        error: "Payment failed",
        details: paymentData.errors || paymentData,
      });
    }

    const payment = paymentData.payment;

    return res.status(200).json({
      success: true,
      orderId: order.id,
      paymentId: payment.id,
      status: payment.status,
      receiptUrl: payment.receipt_url || null,
      totalMoney: amount,
    });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error", details: String(err) });
  }
}

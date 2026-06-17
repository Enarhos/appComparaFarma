const API_URL = "https://payment-api.khipu.com/v3/payments";

export async function createKhipuPayment(amount: number): Promise<string> {
  const receiverId = process.env.KHIPU_RECEIVER_ID ?? "";
  const secret = process.env.KHIPU_SECRET ?? "";

  if (!receiverId || !secret) {
    throw new Error("Khipu credentials not configured");
  }

  const body = {
    amount,
    currency: "CLP",
    subject: "Apoyo a ComparaFarma",
  };

  console.log("[khipu v3] POST", API_URL, JSON.stringify(body));

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": secret,
    },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  console.log("[khipu v3] status:", res.status, "body:", responseText);

  if (!res.ok) {
    throw new Error(`Khipu ${res.status}: ${responseText}`);
  }

  const data = JSON.parse(responseText) as { paymentUrl?: string; payment_url?: string };
  const url = data.paymentUrl ?? data.payment_url;
  if (!url) throw new Error("Khipu no retornó payment_url");
  return url;
}

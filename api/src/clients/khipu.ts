import { createHmac } from "node:crypto";

const API_URL = "https://khipu.com/api/2.0/payments";

export async function createKhipuPayment(amount: number): Promise<string> {
  const receiverId = process.env.KHIPU_RECEIVER_ID ?? "";
  const secret = process.env.KHIPU_SECRET ?? "";

  if (!receiverId || !secret) {
    throw new Error("Khipu credentials not configured");
  }

  // Params sorted alphabetically (required by Khipu HMAC spec)
  const params: Record<string, string> = {
    amount: String(amount),
    currency: "CLP",
    receiver_id: receiverId,
    subject: "Apoyo a ComparaFarma",
  };

  const sortedBody = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  const toSign = `POST&${encodeURIComponent(API_URL)}&${encodeURIComponent(sortedBody)}`;
  const hmac = createHmac("sha256", secret).update(toSign).digest("base64");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `${receiverId}:${hmac}`,
    },
    body: sortedBody,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Khipu ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { payment_url: string };
  return data.payment_url;
}

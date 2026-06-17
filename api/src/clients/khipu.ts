import { createHmac } from "node:crypto";

const API_V2 = "https://khipu.com/api/2.0/payments";

export async function createKhipuPayment(amount: number): Promise<string> {
  const receiverId = process.env.KHIPU_RECEIVER_ID ?? "";
  const secret = process.env.KHIPU_SECRET ?? "";

  if (!receiverId || !secret) {
    throw new Error("Khipu credentials not configured");
  }

  const sortedEntries = Object.entries({
    amount: String(amount),
    currency: "CLP",
    receiver_id: receiverId,
    subject: "Apoyo a ComparaFarma",
  }).sort(([a], [b]) => a.localeCompare(b));

  const sortedBody = new URLSearchParams(sortedEntries).toString();
  const toSign = `POST&${encodeURIComponent(API_V2)}&${encodeURIComponent(sortedBody)}`;
  const hmac = createHmac("sha256", secret).update(toSign).digest("base64");

  const res = await fetch(API_V2, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `${receiverId}:${hmac}`,
    },
    body: sortedBody,
  });

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`Khipu ${res.status}: ${responseText}`);
  }

  const data = JSON.parse(responseText) as { payment_url: string };
  if (!data.payment_url) throw new Error("Khipu no retornó payment_url");
  return data.payment_url;
}

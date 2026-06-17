import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const receiverId = process.env.KHIPU_RECEIVER_ID ?? "";
  const secret = process.env.KHIPU_SECRET ?? "";

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.statusCode = 200;
  res.end(
    JSON.stringify({
      receiver_id_present: !!receiverId,
      receiver_id_length: receiverId.length,
      receiver_id_preview: receiverId ? `${receiverId.slice(0, 3)}***${receiverId.slice(-2)}` : null,
      secret_present: !!secret,
      secret_length: secret.length,
      secret_preview: secret ? `${secret.slice(0, 4)}...${secret.slice(-4)}` : null,
    })
  );
}

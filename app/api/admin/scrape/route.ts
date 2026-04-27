import { NextRequest } from "next/server";
import { liveSearch } from "@/lib/scrapers";
import pool from "@/lib/db";

const COMMON_MEDICATIONS = [
  "paracetamol", "ibuprofeno", "amoxicilina", "metformina", "atorvastatina",
  "losartan", "omeprazol", "aspirina", "enalapril", "amlodipino",
  "clonazepam", "levotiroxina", "sertralina", "salbutamol", "prednisona",
  "diclofenaco", "naproxeno", "ciprofloxacino", "azitromicina",
  "amoxicilina clavulanico", "metronidazol", "fluoxetina", "alprazolam",
  "loratadina", "cetirizina", "dexametasona", "furosemida",
  "espironolactona", "simvastatina",
];

const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const mode  = searchParams.get("mode");

  let medications: string[];
  if (query) {
    medications = [query];
  } else if (mode === "all") {
    const [rows] = await pool.query("SELECT name FROM medications ORDER BY name") as [{ name: string }[], never];
    medications = rows.map((r) => r.name);
  } else {
    medications = COMMON_MEDICATIONS;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "start", total: medications.length });

      let done = 0;
      for (const med of medications) {
        send({ type: "progress", medication: med, done, total: medications.length });
        try {
          await liveSearch(med);
          done++;
          send({ type: "ok", medication: med, done, total: medications.length });
        } catch (e) {
          send({ type: "error", medication: med, error: String(e), done, total: medications.length });
        }
        if (medications.length > 30) await sleep(DELAY_MS);
      }

      send({ type: "done", done, total: medications.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

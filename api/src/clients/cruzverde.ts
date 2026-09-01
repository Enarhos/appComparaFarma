import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const API = "https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search";
const CID = "c19ce24d-1677-4754-b9f7-c193997c5a92";
const BASE = "https://www.cruzverde.cl";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Atributos de Demandware que podrían transportar la bioequivalencia si Cruz
 * Verde los expusiera en el índice de búsqueda. `c_isBioequivalent` es el
 * nombre REAL verificado en el endpoint de detalle; los otros dos son los que
 * leía el código anterior y se conservan por compatibilidad defensiva.
 */
const CRUZ_VERDE_BIO_ATTRIBUTES = [
  "c_isBioequivalent",
  "bioequivalent_indicator",
  "c_bioequivalente",
] as const;

/**
 * Solo un booleano REAL cuenta como evidencia. Ausencia, `null` o cualquier
 * otro tipo ⇒ `null` ("no informado"), nunca `false`.
 */
function readCruzVerdeBioequivalence(hit: Record<string, unknown>): boolean | null {
  for (const attribute of CRUZ_VERDE_BIO_ATTRIBUTES) {
    const value = hit[attribute];
    if (typeof value === "boolean") return value;
  }
  return null;
}

export function parseCruzVerdeResponse(
  data: { hits?: Record<string, unknown>[] },
  query: string
): ScrapedProduct[] {
  return (data.hits ?? []).flatMap((hit) => {
    const price = hit.price as number | null;
    if (!price) return [];
    const id = String(hit.product_id ?? "");
    const name = String(hit.product_name ?? query);
    const img = hit.image as { dis_base_link?: string } | null;
    const imageUrl = img?.dis_base_link ?? null;

    return [{
      name,
      price: Number(price),
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: Boolean(hit.orderable ?? true),
      hasOnlineDelivery: true,
      onlineUrl: id ? `${BASE}/${toSlug(name)}/${id}.html` : `${BASE}/search?q=${encodeURIComponent(name)}`,
      imageUrl,
      // CF-DATA-001 (2026-08-31): el mapeo anterior leía `hit.brand`, un campo
      // que el endpoint NO devuelve — mapeo muerto, `null` en el 100 % de las
      // ofertas. Verificado contra la fuente real (9 búsquedas, 165 hits): las
      // claves de cada `hit` son exactamente `_type, currency, hit_type, image,
      // link, orderable, price, prices, product_id, product_name, product_type,
      // represented_product`. No hay `brand` ni ningún equivalente.
      //
      // Se deja de leer una clave inexistente. Cruz Verde SÍ escribe la marca
      // dentro del nombre ("**Tocalm** Adulto Ambroxol 30 mg/5mL Jarabe 100
      // mL"), y de ahí la deriva `brandFromName()` en el dominio — no acá, para
      // no duplicar esa regla en 9 adaptadores.
      brand: null,
      manufacturer: null,
      // BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30): el endpoint
      // `product_search` de Demandware NO devuelve ningún atributo de
      // bioequivalencia. Auditado contra la fuente real (omeprazol,
      // paracetamol; 27 hits): las claves presentes en cada `hit` son
      // `_type, currency, hit_type, image, link, orderable, price, prices,
      // product_id, product_name, product_type, represented_product` — ni
      // `bioequivalent_indicator` ni `c_bioequivalente` (los dos nombres que
      // leía el código anterior) existen ahí, ni tampoco el nombre real del
      // atributo, que es `c_isBioequivalent`. El `?? false` final convertía
      // ese `undefined` en `false` para el 100% de las ofertas de Cruz Verde
      // (medido en producción: 0 de 170 ofertas con `true`), afirmando "no es
      // bioequivalente" sin ninguna evidencia.
      //
      // El atributo SÍ existe, pero solo en el endpoint de DETALLE de producto
      // (`/products/{id}` → `c_isBioequivalent`, `c_bioequivalence`,
      // `c_bioequivalentSubCategoryID`). Consumirlo exige una request adicional
      // por producto: es una capacidad nueva con impacto de latencia/cuota, no
      // parte de esta corrección semántica — ver FOLLOW_UP del informe.
      //
      // Se mantiene la lectura de los tres nombres posibles por si Cruz Verde
      // los agrega al índice de búsqueda, pero SOLO se acepta un booleano real:
      // cualquier otra cosa (incluida la ausencia) es `null`.
      isBioequivalent: readCruzVerdeBioequivalence(hit),
    }];
  });
}

export async function searchCruzVerde(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({
    q: query,
    count: "24",
    expand: "prices,availability,images",
    client_id: CID,
  });

  const res = await fetchWithTimeout(`${API}?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "x-dw-client-id": CID,
      "Referer": `${BASE}/`,
    },
  });

  if (!res.ok) throw new Error(`Cruz Verde HTTP ${res.status}`);
  const data = await res.json() as { hits?: Record<string, unknown>[] };
  return parseCruzVerdeResponse(data, query);
}

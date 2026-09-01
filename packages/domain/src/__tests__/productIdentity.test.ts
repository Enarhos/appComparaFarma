/**
 * CF-SEARCH-001 — Product Identity & False Merge.
 *
 * Todos los nombres usados como entrada son literales observados en producción
 * real (`GET https://comparafarma-api.vercel.app/api/search`, read-only,
 * 2026-08-27) salvo los marcados explícitamente como SINTÉTICO.
 *
 * Estructura:
 *   1. Extracción de variante comercial  (unitario)
 *   2. Extracción de forma farmacéutica  (unitario)
 *   3. Compatibilidad de identidad       (unitario)
 *   4. Casos A–E del ticket              (integración vía mergeDuplicates)
 *   5. Integridad de oferta en el merge  (integración)
 *   6. No-regresión de matchKey          (guiones, palabras cortas, dosis)
 */
import { describe, expect, it } from "vitest";
import { matchKey } from "../matching.js";
import { mergeDuplicates } from "../deduplication.js";
import { toMedicationResult, toProductIdentity } from "../pricing.js";
import { commercialVariantKey, dosageFormClass, isSameProduct } from "../productIdentity.js";
import type { MedicationResult, PharmacySlug, ScrapedProduct } from "../types.js";

function scraped(over: Partial<ScrapedProduct> & { name: string }): ScrapedProduct {
  return {
    price: 1000,
    onlinePrice: null,
    cmrPrice: null,
    sbpayPrice: null,
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: null,
    imageUrl: null,
    brand: null,
    manufacturer: null,
    isBioequivalent: false,
    ...over,
  };
}

function offer(
  slug: PharmacySlug,
  over: Partial<ScrapedProduct> & { name: string }
): MedicationResult {
  return toMedicationResult(scraped(over), slug, slug);
}

// ---------------------------------------------------------------------------
// 1. VARIANTE COMERCIAL
// ---------------------------------------------------------------------------
describe("commercialVariantKey", () => {
  it("extrae el calificador que sigue a la cabecera de marca", () => {
    expect(commercialVariantKey("Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos")).toBe("rojo");
    expect(commercialVariantKey("Tapsin Periodo x 12 Comprimidos")).toBe("periodo");
    expect(commercialVariantKey("Tapsin Duo Paracetamol Ibuprofeno 12 Comprimidos Recubiertos")).toBe("duo");
    expect(commercialVariantKey("Tapsin Forte x 30 comprimidos")).toBe("forte");
    expect(commercialVariantKey("Tapsin Migraña x 30 comprimidos")).toBe("migrana");
    expect(commercialVariantKey("Tapsin Instaflu Día Noche 6 Comprimidos")).toBe("instaflu");
  });

  it("devuelve null cuando el nombre no declara ningún calificador", () => {
    expect(commercialVariantKey("Tapsin X 6 Comprimidos (Maver)")).toBeNull();
    expect(commercialVariantKey("Tapsin x 30 Comprimidos")).toBeNull();
    expect(commercialVariantKey("Paracetamol 500 mg x 16 comprimidos")).toBeNull();
    expect(commercialVariantKey("Omeprazol 20 mg x 30 cápsulas")).toBeNull();
  });

  it("acepta calificadores de una sola letra pero no conjunciones ni preposiciones", () => {
    // "Tapsin M" (migraña) es una variante real; descartarla partiría dos
    // ofertas que hoy agrupan bien.
    expect(commercialVariantKey("Tapsin M x 10 Comprimidos Recubiertos")).toBe("m");
    expect(commercialVariantKey("Tapsin M Migraña por 10 comprimidos")).toBe("m");
    // "y" en "Tapsin Dia y noche plus" no puede ser el calificador.
    expect(commercialVariantKey("Tapsin Dia y noche plus x 18 comprimidos.")).toBe("plus");
  });

  it("ignora la anotación de laboratorio entre paréntesis", () => {
    // Sin esto, EcoFarmacias derivaba `var:maver` y dejaba de agrupar con las
    // farmacias que no escriben el laboratorio.
    expect(commercialVariantKey("Tapsin Sobre Dia (Maver)")).toBeNull();
    expect(commercialVariantKey("Omeprazol 20 mg x 30 cápsulas. (Curae Spring)")).toBeNull();
    expect(commercialVariantKey("Actron (ibuprofeno) 200mg 10  Cápsulas")).toBeNull();
  });

  it("no confunde la composición con un calificador comercial", () => {
    expect(commercialVariantKey("Glucophage Metformina 500 mg 30 Comprimidos")).toBeNull();
    expect(commercialVariantKey("Aspirina ácido acetilsalicílico 500 mg 20 comprimidos")).toBeNull();
    expect(commercialVariantKey("Kitadol, paracetamol, 500Mg X 24 comp.")).toBeNull();
  });

  it("no confunde el laboratorio del final del título con un calificador", () => {
    // Caso real de Ahumada: el corte en el primer atributo numérico impide que
    // "FAES" termine siendo la variante.
    expect(
      commercialVariantKey(
        "Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol para Inhalación Oral FAES FARMA CHILE"
      )
    ).toBeNull();
  });

  it("un número suelto NO corta la búsqueda del calificador", () => {
    // "Tapsin 1000 SC": el calificador viene DESPUÉS de un número que no es
    // dosis ni cantidad.
    expect(commercialVariantKey("Tapsin 1000 SC 1 g x 20 comprimidos")).toBe("sc");
    expect(commercialVariantKey("Tapsin 1000 SC Paracetamol 1000 mg 20 Comprimidos Recubiertos")).toBe("sc");
  });

  it("normaliza sinónimos observados del mismo calificador", () => {
    expect(commercialVariantKey("Tapsin Niños 160 mg x 16 comprimidos.")).toBe("infantil");
    expect(commercialVariantKey("Tapsin infantil paracetamol 160 mg 16 comprimidos masticables")).toBe("infantil");
    expect(commercialVariantKey("Kitadol inf. gts. 15 mL")).toBe("infantil");
  });

  it("no trata 'adulto' como calificador: es una etiqueta redundante en estos catálogos", () => {
    // Producción, query "aspirina": unas farmacias lo escriben y otras no
    // sobre el MISMO artículo, y la concentración ya separa la presentación
    // adulta de la infantil.
    expect(commercialVariantKey("Aspirina 500 mg Adulto x 40 Comprimidos")).toBeNull();
    expect(commercialVariantKey("Aspirina 500 mg x 40 comprimidos")).toBeNull();
    expect(commercialVariantKey("Aspirina Adultos 500mg x 20 comprimidos")).toBeNull();
  });

  it("devuelve null para combinaciones: lo que sigue a la marca son otros principios activos", () => {
    expect(
      commercialVariantKey("Amoxicilina / Ácido Clavulánico 250/62,5 Polvo Para Suspensión Oral")
    ).toBeNull();
    expect(
      commercialVariantKey("Losartan/Hidroclorotiazida 50 mg/12.5 mg x 30 Comprimidos Recubiertos ASCEND")
    ).toBeNull();
  });

  it("descarta abreviaturas de forma y unidades escritas en palabras", () => {
    expect(commercialVariantKey("Amoval 1 gramo x 14 comprimidos dispersables.")).toBeNull();
    expect(commercialVariantKey("Paracetamol inf. suposit. x 6")).toBe("infantil");
    expect(commercialVariantKey("Ibucalm Ibuprofeno 400 Mg 10 Cap Blandas")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. FORMA FARMACÉUTICA
// ---------------------------------------------------------------------------
describe("dosageFormClass", () => {
  it("clasifica las formas sólidas orales, incluidas abreviaturas", () => {
    expect(dosageFormClass("Tapsin Forte x 20 comprimidos")).toBe("solid-oral");
    expect(dosageFormClass("Omeprazol 20 mg x 30 cápsulas")).toBe("solid-oral");
    expect(dosageFormClass("Paracetamol 500 mg. 16 comp.")).toBe("solid-oral");
    expect(dosageFormClass("Ibucalm Ibuprofeno 400 Mg 10 Cap Blandas")).toBe("solid-oral");
  });

  it("el envase manda sobre su contenido: una cápsula con gránulos es sólida", () => {
    // Con el orden inverso, este producto dejaba de agrupar con "Omeprazol
    // 20 mg x 30 cápsulas" de AraucoMed — un falso split del propio eje.
    expect(
      dosageFormClass("Omeprazol 20 mg x 30 cápsulas con gránulos con recubrimiento entérico")
    ).toBe("solid-oral");
    expect(dosageFormClass("Omeprazol 20 mg 30 Cápsulas con Gránulos")).toBe("solid-oral");
  });

  it("polvos, sobres, jarabes, suspensiones y gotas orales comparten una sola clase", () => {
    // Un "polvo para suspensión oral" y una "suspensión" son el mismo artículo
    // descrito desde distinto ángulo: separarlos era un falso split.
    expect(dosageFormClass("Amoxicilina 500 mg/5 mL polvo para suspensión oral 60 mL")).toBe("fluid-oral");
    expect(dosageFormClass("Amoxicilina 250mg/5ml Jarabe 60ml")).toBe("fluid-oral");
    expect(dosageFormClass("Tapsin Sobre Dia")).toBe("fluid-oral");
    expect(dosageFormClass("Tapsin Paracetamol 100 mg/ml Gotas x 15 mL")).toBe("fluid-oral");
  });

  it("distingue vías no orales", () => {
    expect(dosageFormClass("Dolorub Analgesica-Antiinflamatoria Ibuprofeno 5% Crema Tópica 45 gr")).toBe("topical");
    expect(dosageFormClass("Paracetamol Infantil x 6 supositorios")).toBe("suppository");
    expect(dosageFormClass("Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol para Inhalación Oral")).toBe("inhaled");
  });

  it("reconoce cantidad y forma pegadas en un solo token", () => {
    expect(dosageFormClass("Aspirina Forte 650mg x80com.")).toBe("solid-oral");
    expect(dosageFormClass("Aspirina 500 Mg Caja 100comp")).toBe("solid-oral");
  });

  it("devuelve null cuando el nombre no declara forma", () => {
    expect(dosageFormClass("Omeprazol 20 mg x 60...")).toBeNull();
    expect(dosageFormClass("Tapsin Limonada noche x5g")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. COMPATIBILIDAD DE IDENTIDAD
// ---------------------------------------------------------------------------
describe("isSameProduct", () => {
  const base = toProductIdentity(scraped({ name: "Tapsin Forte x 20 comprimidos", manufacturer: "Maver" }));

  it("acepta la misma oferta descrita por dos farmacias distintas", () => {
    const other = toProductIdentity(scraped({ name: "Tapsin Forte X 20 comprimidos", manufacturer: "Maver" }));
    expect(isSameProduct(base, other)).toBe(true);
  });

  it("rechaza una variante comercial distinta", () => {
    const other = toProductIdentity(scraped({ name: "Tapsin Migraña x 20 comprimidos", manufacturer: "Maver" }));
    expect(isSameProduct(base, other)).toBe(false);
  });

  it("rechaza una forma farmacéutica declarada distinta", () => {
    const other = toProductIdentity(scraped({ name: "Tapsin Forte x 20 sobres", manufacturer: "Maver" }));
    expect(isSameProduct(base, other)).toBe(false);
  });

  it("tolera la forma no declarada: omitirla no afirma nada", () => {
    const other = toProductIdentity(scraped({ name: "Tapsin Forte x 20", manufacturer: "Maver" }));
    expect(other.dosageForm).toBeNull();
    expect(isSameProduct(base, other)).toBe(true);
  });

  it("rechaza dosis, cantidad y bioequivalencia distintas", () => {
    expect(
      isSameProduct(base, toProductIdentity(scraped({ name: "Tapsin Forte x 30 comprimidos", manufacturer: "Maver" })))
    ).toBe(false);
    expect(
      isSameProduct(
        base,
        toProductIdentity(scraped({ name: "Tapsin Forte x 20 comprimidos", manufacturer: "Maver", isBioequivalent: true }))
      )
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. CASOS A–E DEL TICKET
// ---------------------------------------------------------------------------
describe("CF-SEARCH-001 — casos del ticket", () => {
  it("CASO A — 'Tapsin x 6 Comprimidos' y 'Tapsin Rojo Dolor de Cabeza tira x 6' NO se fusionan", () => {
    // El caso que dispara el ticket. Ambas ofertas comparten matchKey
    // (`tapsin|6`), laboratorio (Maver, que AraucoMed sí entrega en
    // `manufacturer_name`) y bioequivalencia: antes del fix nada las separaba.
    const eco = offer("ecofarmacias", {
      name: "Tapsin X 6 Comprimidos (Maver)",
      manufacturer: "Maver",
      price: 460,
    });
    const araucomed = offer("araucomed", {
      name: "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
      manufacturer: "Maver",
      price: 500,
    });

    expect(eco.matchKey).toBe(araucomed.matchKey);
    expect(eco.presentationKey).not.toBe(araucomed.presentationKey);

    const merged = mergeDuplicates([eco, araucomed]);
    expect(merged).toHaveLength(2);
    expect(merged.every((result) => result.prices.length === 1)).toBe(true);
  });

  it("CASO A' — otros falsos merges observados en producción para 'tapsin'", () => {
    // presentationKey tapsin|n|6|bio:false|brand:unknown: $460 vs $4.139.
    expect(
      mergeDuplicates([
        offer("ecofarmacias", { name: "Tapsin X 6 comprimidos Noche (Maver)", price: 460 }),
        offer("ahumada", { name: "Tapsin Instaflu Día Noche 6 Comprimidos", price: 4139 }),
      ])
    ).toHaveLength(2);

    // presentationKey tapsin|12|bio:false|brand:unknown: tres productos.
    expect(
      mergeDuplicates([
        offer("ecofarmacias", { name: "Tapsin X 12 comprimidos (Maver)", price: 1290 }),
        offer("ahumada", { name: "Tapsin Periodo x 12 Comprimidos", price: 2149 }),
        offer("cruz-verde", { name: "Tapsin Duo Paracetamol Ibuprofeno 12 Comprimidos Recubiertos", price: 2290 }),
      ])
    ).toHaveLength(3);

    // presentationKey tapsin|30|bio:false|brand:maver: Forte vs Migraña.
    expect(
      mergeDuplicates([
        offer("araucomed", { name: "Tapsin Forte x 30 comprimidos", manufacturer: "Maver", price: 2990 }),
        offer("farmex", { name: "Tapsin Migraña x 30 comprimidos", manufacturer: "Maver", price: 4990 }),
      ])
    ).toHaveLength(2);

    // presentationKey tapsin|1000mg|20|bio:false|brand:maver: comprimidos vs
    // sobres de polvo efervescente — separados por el eje de forma.
    expect(
      mergeDuplicates([
        offer("farmex", { name: "Tapsin 1000 SC 1 g x 20 comprimidos", manufacturer: "MAVER", price: 4895 }),
        offer("dr-simi", {
          name: "Tapsin SC paracetamol 1 g 20 sobres polvo para solución oral efervescente",
          manufacturer: "MAVER",
          price: 7880,
        }),
      ])
    ).toHaveLength(2);
  });

  it("CASO B — la misma presentación escrita distinto SÍ se fusiona", () => {
    const a = offer("cruz-verde", { name: "Paracetamol 500 mg x 16 comprimidos", price: 840 });
    const b = offer("farmex", { name: "Paracetamol 500mg 16 comp.", price: 626 });

    expect(a.presentationKey).toBe(b.presentationKey);
    const merged = mergeDuplicates([a, b]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
    expect(merged[0].bestPrice).toBe(626);
  });

  it("CASO C — misma marca, distinta dosis: NO se fusionan", () => {
    const merged = mergeDuplicates([
      offer("araucomed", { name: "Losartan 50 mg x 30 comprimidos", manufacturer: "Ascend" }),
      offer("araucomed", { name: "Losartan 100 mg x 30 comprimidos", manufacturer: "Ascend" }),
    ]);
    expect(merged).toHaveLength(2);
  });

  it("CASO D — misma marca y dosis, distinta cantidad: NO se fusionan", () => {
    const merged = mergeDuplicates([
      offer("farmex", { name: "Paracetamol 500 mg x 16 comprimidos" }),
      offer("farmex", { name: "Paracetamol 500 mg x 32 comprimidos" }),
    ]);
    expect(merged).toHaveLength(2);
  });

  describe("CASO E — calificadores comerciales", () => {
    it("Día/Noche siguen separándose por el turno de matchKey, no por el eje de variante", () => {
      const dia = offer("ecofarmacias", { name: "Tapsin Sobre Dia (Maver)" });
      const noche = offer("ecofarmacias", { name: "Tapsin Sobre Noche (Maver)" });
      expect(dia.matchKey).toBe("tapsin|d");
      expect(noche.matchKey).toBe("tapsin|n");
      expect(commercialVariantKey("Tapsin Sobre Dia (Maver)")).toBeNull();
      expect(mergeDuplicates([dia, noche])).toHaveLength(2);
    });

    it("Forte separa: es una concentración/formulación distinta de la base", () => {
      // Producción, query "ibuprofeno": Ipson 100 mg/5 mL vs Ipson Forte
      // 200 mg/5 mL — mismo matchKey (`ipson|120ml|120`), el DOBLE de
      // concentración. Fusionarlos mostraba un "ahorro" inexistente.
      const base = offer("ahumada", { name: "Ipson 100 mg/5 mL x 120 mL Suspensión Oral", price: 6582 });
      const forte = offer("araucomed", { name: "Ipson Forte suspensión oral 200mg/5ml x120ml", price: 6990 });
      expect(base.matchKey).toBe(forte.matchKey);
      expect(mergeDuplicates([base, forte])).toHaveLength(2);
    });

    it("XR / liberación prolongada separa de la formulación normal", () => {
      // Producción, query "metformina": Glafornil 850 vs Glafornil XR 850.
      const normal = offer("ahumada", { name: "Glafornil 850 mg x 30 Comprimidos Recubiertos", price: 15918 });
      const xr = offer("ecofarmacias", {
        name: "Glafornil XR Metformina 850mg x 30 comp. liberación prolongada",
        price: 19300,
      });
      expect(normal.matchKey).toBe(xr.matchKey);
      expect(commercialVariantKey(xr.canonicalName)).toBe("xr");
      expect(mergeDuplicates([normal, xr])).toHaveLength(2);
    });

    it("Infantil separa, y sus sinónimos siguen agrupando entre sí", () => {
      const ninos = offer("araucomed", { name: "Tapsin Niños 160 mg x 16 comprimidos.", manufacturer: "Maver" });
      const infantil = offer("dr-simi", {
        name: "Tapsin infantil paracetamol 160 mg 16 comprimidos masticables infantil",
        manufacturer: "Maver",
      });
      const adulto = offer("ahumada", { name: "Tapsin 160 mg x 16 Comprimidos Masticables", manufacturer: "Maver" });

      // "Niños" e "infantil" son el mismo calificador.
      expect(ninos.presentationKey).toBe(infantil.presentationKey);
      expect(mergeDuplicates([ninos, infantil])).toHaveLength(1);

      // Un nombre que NO declara el calificador no se fusiona con uno que sí:
      // política conservadora. Es un falso split conocido y aceptado.
      expect(mergeDuplicates([ninos, adulto])).toHaveLength(2);
    });

    it("Adulto NO separa: es una etiqueta redundante que unas farmacias escriben y otras no", () => {
      const merged = mergeDuplicates([
        offer("ecofarmacias", { name: "Aspirina 500 mg Adulto x 40 Comprimidos", price: 1000 }),
        offer("farmex", { name: "Aspirina 500 mg x 40 comprimidos", price: 2970 }),
        offer("araucomed", { name: "Aspirina 500 mg x 40 comprimidos.", price: 3290 }),
      ]);
      expect(merged).toHaveLength(1);
      expect(merged[0].prices).toHaveLength(3);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. INTEGRIDAD DE OFERTA EN EL MERGE
// ---------------------------------------------------------------------------
describe("mergeDuplicates — integridad de oferta", () => {
  it("el nombre y el laboratorio de la tarjeta vienen de una oferta que SÍ aparece en sus precios", () => {
    // Defecto original: `canonical` se elegía sobre TODO el grupo pero
    // `prices` se quedaba con la oferta más barata de cada farmacia, así que
    // la oferta que daba el nombre podía no estar entre los precios. Acá la
    // oferta con laboratorio (la preferida como canónica) es la MÁS CARA de su
    // propia farmacia, así que antes del fix quedaba descartada de `prices`
    // y su nombre igual titulaba la tarjeta.
    const conNombre = offer("farmex", {
      name: "Tapsin Duo x 12 comprimidos",
      manufacturer: "Maver",
      price: 2500,
    });
    const masBarata = offer("farmex", {
      name: "Tapsin Duo x 12 comprimidos recubiertos",
      manufacturer: "Maver",
      price: 1890,
    });

    expect(conNombre.presentationKey).toBe(masBarata.presentationKey);

    const merged = mergeDuplicates([conNombre, masBarata]);
    expect(merged).toHaveLength(1);
    const card = merged[0];
    expect(card.prices).toHaveLength(1);
    expect(card.prices[0].productName).toBe(card.canonicalName);
  });

  it("cada precio conserva su propia farmacia, canal y URL tras el merge", () => {
    const eco = offer("ecofarmacias", {
      name: "Tapsin Forte x 20 comprimidos",
      manufacturer: "Maver",
      price: 2980,
      onlineUrl: "https://www.ecofarmacias.cl/producto/tapsin-forte-x-20/",
    });
    const araucomed = offer("araucomed", {
      name: "Tapsin Forte x 20 comprimidos",
      manufacturer: "Maver",
      price: 1990,
      onlineUrl: "https://farmacia.araucomed.com/analgesicos-y-antinflamatorios/tapsin-forte-x20com",
    });

    const merged = mergeDuplicates([eco, araucomed]);
    expect(merged).toHaveLength(1);

    const byPharmacy = new Map(merged[0].prices.map((price) => [price.pharmacySlug, price]));
    expect(byPharmacy.get("ecofarmacias")!.onlineUrl).toContain("ecofarmacias.cl");
    expect(byPharmacy.get("ecofarmacias")!.channels.effective).toBe(2980);
    expect(byPharmacy.get("araucomed")!.onlineUrl).toContain("araucomed.com");
    expect(byPharmacy.get("araucomed")!.channels.effective).toBe(1990);
    expect(merged[0].bestPharmacy).toBe("araucomed");
  });

  it("la imagen de la tarjeta nunca viene de una oferta descartada", () => {
    const canonica = offer("araucomed", {
      name: "Tapsin Forte x 20 comprimidos",
      manufacturer: "Maver",
      price: 1990,
      imageUrl: "https://farmacia.araucomed.com/img/tapsin-forte.jpg",
    });
    const descartada = offer("araucomed", {
      name: "Tapsin Forte x 20 comprimidos recubiertos por caja arrugada",
      manufacturer: "Maver",
      price: 2990,
      imageUrl: "https://farmacia.araucomed.com/img/otra.jpg",
    });

    expect(canonica.presentationKey).toBe(descartada.presentationKey);

    const merged = mergeDuplicates([canonica, descartada]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(1);
    expect(merged[0].imageUrl).toBe(merged[0].prices[0].imageUrl);
  });

  it("la elección de la tarjeta canónica es determinista ante empates", () => {
    // Importa para Web: el slug de la ficha se deriva de `canonicalName`, y una
    // elección dependiente del orden de llegada de las farmacias hacía derivar
    // el slug entre búsquedas — la causa del redirect loop documentado en
    // web/src/lib/resolveMedication.ts. Empate total: mismo laboratorio, mismo
    // largo de nombre, mismo precio; desempata el slug de farmacia.
    const a = offer("ahumada", { name: "Tapsin Forte x 20 comprimidos", manufacturer: "Maver", price: 1990 });
    const b = offer("farmex", { name: "Tapsin Forte X 20 comprimidos", manufacturer: "Maver", price: 1990 });

    const forward = mergeDuplicates([a, b])[0];
    const backward = mergeDuplicates([b, a])[0];
    expect(forward.canonicalName).toBe(backward.canonicalName);
    expect(forward.canonicalName).toBe("Tapsin Forte x 20 comprimidos");
    expect(forward.laboratory).toBe(backward.laboratory);
    expect(forward.presentationKey).toBe(backward.presentationKey);
  });

  it("una oferta con identidad contradictoria no se mezcla aunque comparta presentationKey", () => {
    // Red de seguridad de la capa de validación: se fuerza a mano la MISMA
    // `presentationKey` sobre dos productos que el algoritmo de nombre
    // considera incompatibles. `mergeDuplicates` debe negarse a mezclarlos.
    const real = offer("araucomed", { name: "Tapsin Forte x 20 comprimidos", manufacturer: "Maver", price: 1990 });
    const contaminada: MedicationResult = {
      ...offer("farmex", { name: "Tapsin Migraña x 30 comprimidos", manufacturer: "Maver", price: 4990 }),
      presentationKey: real.presentationKey,
    };

    const merged = mergeDuplicates([real, contaminada]);
    expect(merged).toHaveLength(2);
    expect(merged.flatMap((card) => card.prices)).toHaveLength(2);
    for (const card of merged) {
      for (const price of card.prices) {
        expect(matchKey(price.productName)).toBe(matchKey(card.canonicalName));
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. NO-REGRESIÓN DE matchKey
// ---------------------------------------------------------------------------
describe("CF-SEARCH-001 — no-regresión de matchKey", () => {
  it("matchKey no cambió: su valor está persistido en historiales y alertas", () => {
    expect(matchKey("Paracetamol 500 mg Comprimidos x20")).toBe("paracetamol|500mg|20");
    expect(matchKey("PARACETAMOL INF GOTAS 100mg/ml 15ml")).toBe("paracetamol|15ml");
    expect(matchKey("Amoxicilina 0.5 g cápsulas")).toBe("amoxicilina|500mg");
    expect(matchKey("Tapsin Plus Día Paracetamol 650 mg 1 Sobre")).toBe("tapsin|650mg|d");
    expect(matchKey("Tapsin Insta Flu Polvo Día")).toBe("tapsin|d");
    expect(matchKey("Losartan Potasico 50 mg x 30 comprimidos")).toBe("losartan|50mg|30");
  });

  it("los nombres compuestos con guión siguen colapsando igual, y su variante es null", () => {
    // La extracción de variante reutiliza la cabecera que ya calcula matchKey,
    // así que "Trio-Val" y "Trio Val" derivan la MISMA identidad — deducirla
    // por separado habría dado `var:val` solo para la versión con espacio.
    expect(matchKey("Trio-Val 500 mg x 20 comprimidos")).toBe(
      matchKey("Trio Val 500 mg x 20 comprimidos")
    );
    expect(commercialVariantKey("Trio-Val 500 mg x 20 comprimidos")).toBeNull();
    expect(commercialVariantKey("Trio Val 500 mg x 20 comprimidos")).toBeNull();

    expect(matchKey("Co-Amoxiclav 500 mg x 20 comprimidos")).toBe("coamoxiclav|500mg|20");
    expect(commercialVariantKey("Co-Amoxiclav 500 mg x 20 comprimidos")).toBeNull();

    const merged = mergeDuplicates([
      offer("cruz-verde", { name: "Trio-Val 500 mg x 20 comprimidos", price: 1000 }),
      offer("ahumada", { name: "Trio Val 500 mg x 20 comprimidos", price: 1200 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });

  it("la fusión de dos palabras cortas sigue consumiendo AMBAS como cabecera de marca", () => {
    // SINTÉTICO — verifica la regla `first.length <= 4 && second.length <= 4`
    // de matchKey desde la capa de variante.
    expect(matchKey("Tri Fen 500 mg x 10 comprimidos")).toBe("trifen|500mg|10");
    expect(commercialVariantKey("Tri Fen 500 mg x 10 comprimidos")).toBeNull();
    expect(commercialVariantKey("Tri Fen Forte 500 mg x 10 comprimidos")).toBe("forte");
  });
});

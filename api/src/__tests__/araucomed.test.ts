import { describe, expect, it } from "vitest";
import { parseAraucoMedResponse } from "../clients/araucomed.js";

const SAMPLE_HTML = `
<article class="product-miniature js-product-miniature" data-id-product="123">
  <div class="thumbnail-container">
    <img src="https://farmacia.araucomed.com/123-home_default/paracetamol.jpg" />
    <ul class="product-flags"></ul>
  </div>
  <div class="product-meta">
    <h3 class="h3 product-title" itemprop="name">
      <a href="https://farmacia.araucomed.com/medicamentos/123-paracetamol-500mg.html">Paracetamol 500mg x16</a>
    </h3>
    <div class="product-price-and-shipping ">
      <span class="price" itemprop="offers" itemscope>
        <span itemprop="priceCurrency" content="CLP"></span>
        <span itemprop="price" content="1490">$1.490</span>
      </span>
    </div>
  </div>
</article>
<article class="product-miniature js-product-miniature" data-id-product="456">
  <ul class="product-flags"><li class="product-flag out_of_stock">Agotado</li></ul>
  <h3 class="h3 product-title" itemprop="name">
    <a href="https://farmacia.araucomed.com/medicamentos/456-ibuprofeno.html">Ibuprofeno 400mg x10</a>
  </h3>
  <span itemprop="price" content="2990">$2.990</span>
</article>
`;

describe("parseAraucoMedResponse", () => {
  it("parses name, price, url, image and stock from HTML", () => {
    const results = parseAraucoMedResponse(SAMPLE_HTML);
    expect(results).toHaveLength(2);

    const [first, second] = results;
    expect(first.name).toBe("Paracetamol 500mg x16");
    expect(first.price).toBe(1490);
    expect(first.onlineUrl).toBe("https://farmacia.araucomed.com/medicamentos/123-paracetamol-500mg.html");
    expect(first.imageUrl).toContain("home_default");
    expect(first.hasStock).toBe(true);

    expect(second.name).toBe("Ibuprofeno 400mg x10");
    expect(second.price).toBe(2990);
    expect(second.hasStock).toBe(false);
  });

  it("ignores products with price 0", () => {
    const html = `
      <article class="product-miniature">
        <h3 class="product-title" itemprop="name"><a href="/x">Sin precio</a></h3>
        <span itemprop="price" content="0">$0</span>
      </article>`;
    expect(parseAraucoMedResponse(html)).toHaveLength(0);
  });
});

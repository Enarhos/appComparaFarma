import { describe, it, expect } from "vitest";
import { toJsonLdScript } from "./structuredData";

describe("toJsonLdScript", () => {
  it("serializes plain data to JSON", () => {
    expect(toJsonLdScript({ a: 1, b: "texto" })).toBe('{"a":1,"b":"texto"}');
  });

  it("escapes '<' so a product name containing '</script>' cannot close the tag early", () => {
    const malicious = { name: '</script><script>alert(1)</script>' };

    const output = toJsonLdScript(malicious);

    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script>");
    expect(output).toContain("\\u003cscript>");
  });
});

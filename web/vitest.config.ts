import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Monorepo pnpm con node-linker=hoisted: react-dom no tiene su propia copia
// anidada de react en web/node_modules, así que puede terminar usando una
// copia física distinta de la que resuelve "react" desde src/ — dos React
// "diferentes" (mismo número de versión) rompen los hooks con
// "Cannot read properties of null (reading 'useState')". Se fuerza a que
// ambos alias apunten exactamente a la copia de react que usa react-dom.
const reactDomDir = path.dirname(require.resolve("react-dom/package.json"));
const reactDir = path.dirname(require.resolve("react/package.json", { paths: [reactDomDir] }));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: reactDir,
      "react-dom": reactDomDir,
    },
    dedupe: ["react", "react-dom"],
  },
});

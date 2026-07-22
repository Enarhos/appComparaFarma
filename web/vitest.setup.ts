import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React 19 no detecta el entorno de test automáticamente con Vitest/jsdom en
// este monorepo — sin esto, act() de Testing Library no envuelve el render y
// las aserciones corren antes de que React pinte nada.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// El auto-cleanup de Testing Library está pensado para el entorno global de
// Jest — con Vitest hay que registrarlo a mano, si no cada test dentro del
// mismo archivo se acumula en document.body.
afterEach(() => {
  cleanup();
});

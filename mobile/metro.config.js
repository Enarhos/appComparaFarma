const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// En un monorepo pnpm los node_modules están en la raíz, no en mobile/
const projectRoot  = __dirname;                          // .../appComparaFarma/mobile
const workspaceRoot = path.resolve(projectRoot, "..");  // .../appComparaFarma

const config = getDefaultConfig(projectRoot);

// 1. Metro vigila también la raíz del monorepo para resolver paquetes
config.watchFolders = [workspaceRoot];

// 2. Resuelve módulos primero en mobile/node_modules, luego en la raíz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot,   "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });

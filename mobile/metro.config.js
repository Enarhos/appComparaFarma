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

// 3. Con pnpm node-linker=hoisted, mobile/node_modules no existe.
//    El entry point del bundle llega como "./node_modules/expo-router/entry".
//    Lo convertimos a bare specifier para que nodeModulesPaths lo resuelva
//    desde el workspace root.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (/^\.\.?\/node_modules\//.test(moduleName)) {
    const bare = moduleName.replace(/^\.\.?\/node_modules\//, "");
    return context.resolveRequest(context, bare, platform);
  }
  // TypeScript ESM packages (moduleResolution: NodeNext) use .js extensions in imports.
  // Metro can't remap .js → .ts on its own; try the .ts source file first.
  if (moduleName.endsWith(".js")) {
    try {
      return context.resolveRequest(context, moduleName.slice(0, -3) + ".ts", platform);
    } catch {
      // genuine .js file — fall through to default resolution
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });

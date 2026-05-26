const path = require("path");
const os   = require("os");
const fs   = require("fs");
const https = require("https");

const configPath = path.join(os.homedir(), ".expo", "state.json");
const data = JSON.parse(fs.readFileSync(configPath, "utf8"));
const sessionSecret = data.auth?.sessionSecret;
if (!sessionSecret) { console.error("No session secret found. Run: eas login"); process.exit(1); }

const query = `{
  "query": "query { app { byFullName(fullName: \\"@belford/compara-farma\\") { id androidAppCredentials { id androidAppBuildCredentialsList { androidKeystore { id keystore keystorePassword keyAlias keyPassword type } } } } } }"
}`;

const options = {
  hostname: "api.expo.dev",
  path: "/graphql",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "expo-session": sessionSecret,
    "Content-Length": Buffer.byteLength(query),
  },
};

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (d) => (body += d));
  res.on("end", () => {
    try {
      const result = JSON.parse(body);
      if (result.errors) {
        console.error("GraphQL errors:", JSON.stringify(result.errors, null, 2));
        return;
      }
      const appCreds = result?.data?.app?.byFullName?.androidAppCredentials;
      if (!appCreds) { console.log("No Android credentials found."); console.log(JSON.stringify(result, null, 2)); return; }

      const buildCreds = Array.isArray(appCreds)
        ? appCreds.flatMap((c) => c.androidAppBuildCredentialsList ?? [])
        : (appCreds.androidAppBuildCredentialsList ?? []);

      buildCreds.forEach((bc) => {
          const ks = bc.androidKeystore;
          if (!ks || !ks.keystore) { console.log("No keystore data in credential."); return; }

          // keystore is base64-encoded
          const keystoreBuf = Buffer.from(ks.keystore, "base64");
          const outPath = path.join(
            __dirname, "..", "mobile", "android", "app", "release.keystore"
          );
          fs.writeFileSync(outPath, keystoreBuf);
          console.log("✅ Keystore saved to:", outPath);
          console.log("   Key Alias:         ", ks.keyAlias);
          console.log("   Keystore Password: ", ks.keystorePassword);
          console.log("   Key Password:      ", ks.keyPassword);
          console.log("   Type:              ", ks.type);
        });
      if (!buildCreds.length) { console.log("No build credentials found."); }
    } catch (e) {
      console.error("Error parsing response:", e.message);
      console.log("Raw body:", body.substring(0, 500));
    }
  });
});

req.on("error", (e) => console.error("Request error:", e));
req.write(query);
req.end();

import http from "http";
import serverless from "~/serverless";

let app: App | undefined;

const load =
  typeof __non_webpack_require__ !== "undefined"
    ? __non_webpack_require__
    : require;

const serverlessLookupFiles = ["__sk__app.js", "server.js", "serverless.js"];

for (let file of serverlessLookupFiles) {
  try {
    const mod = load(`./${file}`);
    // @ts-ignore
    app = mod.default || mod;
    break;
  } catch {}
}

if (!app) {
  app = async (
    _: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> => {
    res.write("Exported app is not found.");
    res.end();
  };
}

export const renderer = serverless(app);

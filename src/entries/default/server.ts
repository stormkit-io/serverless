import type { App } from "~/serverless";
import http from "http";
import serverless from "../../serverless";
import { serverlessLookupFiles } from "../../presets/default/constants";

let app: App | undefined;

for (let file of serverlessLookupFiles) {
  try {
    const mod = require(`./${file}`);
    // @ts-ignore
    app = mod.default || mod;
    break;
  } catch (e) {
    console.error(e);
  }
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

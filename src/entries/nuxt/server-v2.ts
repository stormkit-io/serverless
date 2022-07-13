import http from "http";
import serverless from "../../serverless";
import { load } from "../../utils";

// This is the lambda file that will be compiled on build time.
// It will be used as the entry point for the lambda function.
process.env.NUXT_TELEMETRY_DISABLED = "1";

const { loadNuxt } = load("nuxt");
let nuxt: any;

export const renderer = serverless(
  async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> => {
    if (!nuxt) {
      nuxt = await loadNuxt({
        for: "start",
        configOverrides: {
          render: {
            compressor: false,
            http2: false,
          },
        },
      });
    }

    return new Promise((resolve) => {
      nuxt.hook("render:routeDone", resolve);
      nuxt.render(req, res);
    });
  }
);

import http from "http";
import serverless from "~/serverless";

// This is the lambda file that will be compiled on build time.
// It will be used as the entry point for the lambda function.
process.env.NUXT_TELEMETRY_DISABLED = "1";

const load =
  typeof __non_webpack_require__ !== "undefined"
    ? __non_webpack_require__
    : require;

const { Nuxt } = load("nuxt-start");

const nuxt = new Nuxt({
  dev: false,
  render: {
    compressor: false,
    http2: false,
  },
});

let ready: boolean;

export const renderer = serverless(
  async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> => {
    if (!ready) {
      ready = await nuxt.ready();
    }

    return new Promise((resolve) => {
      nuxt.hook("render:routeDone", resolve);
      nuxt.render(req, res);
    });
  }
);

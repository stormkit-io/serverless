<h1 align="center">Stormkit Serverless</h1>
<p align="center">Export node.js applications into serverless compatible functions</p>
<hr />

Stormkit servesless is a low-level repository to make your code work in serverless environments. 

## For whom is this package targeted for? 

This repository is used internally by [Stormkit](https://www.stormkit.io). It adds serverless compatibility to applications hosted on Stormkit.

## Installation

```
npm i @stormkit/serverless
```

## Example usage

```js
import http from "http";
import serverless from "@stormkit/serverless";

export const handler = serverless(
  async (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.write("Hello from " + req.url);
    res.end();
  }
);
```

If you know beforehand the platform that is going to be deployed, you can import directly
the relevant handler:

```js
import serverless from "@stormkit/serverless/aws";

export const handler = serverless(
  async (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.write("Hello from " + req.url);
    res.end();
  },
);
```

## API Functions

If you're using [API functions](https://www.stormkit.io/docs/features/writing-api), and would like to
deploy to a custom environment you can use our middlewares:

```js
import api from "@stormkit/serverless/middlewares/express";
import express from "express";
import vite from "vite";

// Create Vite server in middleware mode and configure the app type as
// 'custom', disabling Vite's own HTML serving logic so parent server
// can take control
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});

// use vite's connect instance as middleware
// if you use your own express router (express.Router()), you should use router.use
app.use(vite.middlewares);

// Add support for a local environment API.
app.all(["/api", "/api/*"], apiMiddleware({
  apiDir: "src/api",
  moduleLoader: vite.ssrLoadModule
}));
```

## License 

Made with 💛 Published under [MIT](./LICENSE).

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

By default the above example will use a Stormkit handler for SSR. To use a different handler specify the secondary argument:

```js
export const handler = serverless(
  async (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.write("Hello from " + req.url);
    res.end();
  },
  "stormkit:api"
);
```

## License 

Made with 💛 Published under [MIT](./LICENSE).

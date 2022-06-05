<h1 align="center">Stormkit Serverless</h1>
<p align="center">Export node.js applications into serverless compatible functions</p>

**Note** This package is still under development and there is no published package yet.

## Why?

Stormkit servesless provides handy wrappers to make your code work in serverless environments. 

## Example usage

```js
import http from "http";
import serverless from "@stormkit/serverless";

export const handler = serverless.awsAlb(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.write("Hello from " + req.url);
    res.end();
  }
);
```

This makes your function much more portable. The wrapper will take the incoming `event` and transform
it into a Node.js `http.IncomingMessage` object.

## Currently supported signatures

Each provider has it's own signature to call a serverless function. Here's the list of the currently
supported providers:

- [Stormkit](https://www.stormkit.io)
- [AWS ALB](https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html)

## License 

Made with 💛 Published under [MIT](./LICENSE).

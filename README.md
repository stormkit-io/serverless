<h1 align="center">Stormkit Serverless</h1>
<p align="center">Export node.js applications into serverless compatible functions</p>
<hr />

Stormkit servesless provides handy wrappers to make your code work in serverless environments. 
This makes your function much more portable. The wrapper will take the incoming `event` and transform
it into a Node.js `http.IncomingMessage` object.

## For whom is this package targeted for? 

This repository is intended for users who care about portability. If you know you'll be using AWS Lambda and 
you don't need to make your code portable, then this package may be overengineering for your needs. If, 
however, you'd like to deploy your application to multiple providers, then this package can be helpful.

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

By default the above example will use a Stormkit handler. To change this behaviour you can tell
the `serverless` function which handler to use.

```js
export const handler = serverless(
  async (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.write("Hello from " + req.url);
    res.end();
  },
  "awsAlb"
);
```

In order to avoid setting the handler type all the time, you can also use the `process.env.SERVERLESS_HANDLER`
environment variable to set a different default type. Allowed types are:

- `awsAlb`
- `stormkit`

If you need a different handler, feel free to [open a issue](https://github.com/stormkit-io/serverless/issues) 🙏🏻

## Currently supported signatures

Each provider has it's own signature to call a serverless function. Here's the list of the currently
supported providers:

- [Stormkit](https://www.stormkit.io)
- [AWS ALB](https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html)

## License 

Made with 💛 Published under [MIT](./LICENSE).

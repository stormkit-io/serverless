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

To avoid setting the handler type all the time, you can also use the `process.env.SERVERLESS_HANDLER`
environment variable to set a different default type. Allowed types are:

- `awsAlb`
- `stormkit`

If you need a different handler, feel free to [open a issue](https://github.com/stormkit-io/serverless/issues) 🙏🏻

## Currently supported signatures

Each provider has it's own signature to call a serverless function. Here's the list of the currently
supported providers:

- [Stormkit](https://www.stormkit.io)
- [AWS ALB](https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html)

## Testing locally

It is possible to test this repository locally by using the [dev-server](./src/dev-server/index.ts).

1. Open a terminal
2. Go to your project
3. Build your project (usually `npm run build`)
4. Clone `@stormkit/serverless` (where you clone is unimportant)
6. Run `npm install`
7. Run `REPO_PATH=<local-path-to-your-repo> npm run dev`

Currently `nuxt` and `next` projects are detected and configured automatically. If you're testing other
frameworks, you can submit a [feature request](https://github.com/stormkit-io/serverless/issues).

**Note**: `nuxt` `v3` uses a built-in Stormkit preset, therefore this repository does not include any logic
specific to `v3`. 

Alternatively, you can install `@stormkit/serverless` and run the local server directly in your 
repository with programmatic usage:

```javascript
import DevServer from "@stormkit/serverless/dist/dev-server"

new DevServer({
  host: "localhost",
  port: 3000,
  dir: "path/to/api/folder"
}).listen()

// And then simply call `ts-node <your-file>.ts` to spawn the dev-server up. 
// Alternatively, you can also use `nodemon` to listen to the changes.
```

See [dev-server](./src/dev-server.ts) for the available options.

## License 

Made with 💛 Published under [MIT](./LICENSE).

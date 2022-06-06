declare module "@stormkit/serverless" {
  import { IncomingMessage, Server, ServerResponse } from "http";

  type HandlerType = "awsAlb" | "stormkit";

  export default function serverless(fn: App, h?: HandlerType): Promise<void>;

  export interface Request extends IncomingMessage {}
  export interface Response extends ServerResponse {}
  export type App = (req: Request, res: Response) => Promise<void>;
}

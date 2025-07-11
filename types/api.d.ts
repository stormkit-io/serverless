import { Serverless } from "./global.d";

export declare const invokeApiHandler: (
  handler: any,
  req: any,
  res: any
) => Promise<Serverless.Response | void>;

export declare const handleApi: (
  event: Serverless.RequestEvent,
  apiDir: string
) => Promise<Serverless.Response>;

export default (dirname: string) => Promise<Serverless.Response>;

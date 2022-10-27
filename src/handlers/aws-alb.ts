import type { App, NodeContext } from "../serverless";
import type { NodeRequest } from "../request";
import { handleSuccess, handleError } from "../utils";

export type AwsCallback = (e: Error | null, data: any) => void;

export type AwsAlbHandler = (
  request: ALBRequest,
  context: NodeContext,
  callback: AwsCallback
) => Promise<void>;

export interface ALBRequest {
  httpMethod: string;
  path: string;
  queryStringParameters: QueryStringParameters;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}

type QueryStringParameters = Record<string, string | string[]>;

const withQuery = (path: string, query?: QueryStringParameters): string => {
  if (!query) {
    return path;
  }

  // @ts-ignore
  return `${path}?${new URLSearchParams(query).toString()}`;
};

export default (app: App): AwsAlbHandler =>
  async (event, context, callback) => {
    // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
    context.callbackWaitsForEmptyEventLoop = false;

    const url = withQuery(event.path, event.queryStringParameters);

    const request: NodeRequest = {
      url,
      path: url.split("?")?.[0] || "/",
      method: event.httpMethod,
      headers: event.headers,
      body: event.body,
      context: {},
    };

    try {
      callback(null, await handleSuccess(app, request, context));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };

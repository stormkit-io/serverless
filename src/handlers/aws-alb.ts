import { handleSuccess, handleError } from "../utils";

interface Context {
  callbackWaitsForEmptyEventLoop?: boolean;
}

type QueryStringParameters = Record<string, string | string[]>;

export interface ALBRequest {
  httpMethod: string;
  path: string;
  queryStringParameters: QueryStringParameters;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}

const withQuery = (path: string, query?: QueryStringParameters): string => {
  if (!query) {
    return path;
  }

  return `${path}?${new URLSearchParams(query).toString()}`;
};

export default (app: SupportedApps) =>
  async (event: ALBRequest, context: Context, callback: Callback) => {
    // https://www.jeremydaly.com/reuse-database-connections-aws-lambda/
    context.callbackWaitsForEmptyEventLoop = false;

    const url = withQuery(event.path, event.queryStringParameters);

    const request: NodeRequest = {
      url,
      path: url.split("?")?.[0] || "/",
      method: event.httpMethod,
      headers: event.headers,
      body: event.body,
    };

    try {
      callback(null, await handleSuccess(app, request));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };

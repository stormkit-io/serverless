import { handleSuccess, handleError } from "../utils";

type QueryStringParameters = Record<string, string | string[]>;

const withQuery = (path: string, query?: QueryStringParameters): string => {
  if (!query) {
    return path;
  }

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
    };

    try {
      callback(null, await handleSuccess(app, request));
    } catch (e) {
      handleError(callback)(e as Error);
    }
  };

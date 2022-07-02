declare type AwsCallback = (e: Error | null, data: any) => void;

declare interface AwsContext {
  callbackWaitsForEmptyEventLoop?: boolean;
}

declare type AwsAlbHandler = (
  request: ALBRequest,
  context: AwsContext,
  callback: AwsCallback
) => Promise<void>;

declare interface ALBRequest {
  httpMethod: string;
  path: string;
  queryStringParameters: QueryStringParameters;
  headers: Record<string, string>;
  body: string;
  isBase64Encoded: boolean;
}

declare type StormkitHandler = (
  request: NodeRequest,
  context: AWSContext,
  callback: AwsCallback
) => Promise<void>;

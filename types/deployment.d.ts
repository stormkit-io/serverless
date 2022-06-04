type lambdaRuntime = "nodejs12.x" | "nodejs14.x";

declare interface Deployment {
  client: {
    repo: string;
    id: string;
    accessToken: string;
  };

  build: {
    env: string;
    branch: string;
    cmd: string;
    distFolder: string;
    vars: Record<string, string>;
    cdn: {
      publicPath: string;
    };
  };
}

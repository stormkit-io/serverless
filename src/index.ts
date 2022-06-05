import awsAlbHandler from "./handlers/aws-alb";
import stormkitHandler from "./handlers/stormkit";

const serverless = (app: App) => {
  return stormkitHandler(app);
};

serverless.stormkit = stormkitHandler;
serverless.awsAlb = awsAlbHandler;

export default serverless;

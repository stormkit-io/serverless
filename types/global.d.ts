export interface SKObject {
  envId?: string;
  apiKey?: string;
  baseUrl?: string;
  features?: Record<string, boolean>;
}

declare global {
  var sk: SKObject;
}

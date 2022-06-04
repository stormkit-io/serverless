declare interface CDNFile {
  fileName: string;
  headers?: Record<string, string>;
}

declare interface Redirect {
  status: number;
  from: string;
  to: string;
  headers?: Record<string, string>;
}

// The build manifest contains information on the build
declare interface BuildManifest {
  cdnFiles?: CDNFile[];
  redirects?: Redirect[];
  isNextGen?: boolean;
  functionHandler?: string;
}

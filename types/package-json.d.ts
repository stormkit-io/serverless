declare interface PackageJson {
  version?: string;
  name: string;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  bundleDependencies?: string[];
  bundledDependencies?: string[]; // alias
  scripts?: Record<string, string>;
  files?: string[];
  workspaces?: [];
}

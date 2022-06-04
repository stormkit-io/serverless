declare interface PackFilesOptions {
  zipDir?: string;
  npmPack?: string[];
}

interface ArtifactsMeta {
  cdnFiles: string;
  serverFiles?: PackFilesOptions;
  bundle?: string[];
}

declare interface BuilderInterface {
  postExec(): Promise<ArtifactsMeta>;
}

declare interface BuilderProps {
  manifest: BuildManifest;
  packageJson: PackageJson;
  rootDir: string;
  meta: Metadata;
  buildConfig: {
    cwd?: string;
    cmds: string[];
    distDir?: string;
    vars?: Record<string, string>;
    withEnvFile?: boolean;
  };
}

declare interface CustomBuilderProps extends Omit<BuilderProps, "rootDir"> {
  repoDir: string; // Path to repository
  filesDir: string; // Path to files folder where we have our server artifacts
}

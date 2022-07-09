export interface AngularJSON {
  version: string;
  defaultProject: string;
  projects: {
    [projectName: string]: {
      architect?: {
        build?: {
          options?: {
            outputPath: string;
          };
        };
        server?: {
          options?: {
            outputPath: string;
            main: string;
          };
        };
      };
    };
  };
}

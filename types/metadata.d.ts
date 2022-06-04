declare type Framework = "nuxt" | "next" | "angular";
declare type Library = "react" | "vue";
declare type PackageManager = "yarn" | "npm";

declare interface Metadata {
  packageManager: PackageManager;
  framework?: Framework;
  library?: Library;
}

import type { PackageJson } from "../presets";

export const getDependency = (
  pck: PackageJson,
  dep: string
): string | undefined => {
  return Object.assign({}, pck.devDependencies, pck.dependencies)[dep];
};

const IGNORED_MODULES = ["typescript", "prettier", "jest"];

const IGNORED_MODULES_PREFIX = [
  "@typescript",
  "@testing-library",
  "@types/",
  "@babel",
  "babel-",
  "lint-",
  "eslint",
  "stylelint",
  "webpack",
];

export const getProductionDependencies = (pck: PackageJson): string[] => {
  const bundledDeps = pck.bundleDepedencies || pck.bundledDependencies;

  if (bundledDeps?.length) {
    return bundledDeps;
  }

  return Object.keys(pck.dependencies || {}).filter((dep) => {
    for (const mod of IGNORED_MODULES) {
      if (dep === mod) {
        return false;
      }
    }

    for (const mod of IGNORED_MODULES_PREFIX) {
      if (dep.indexOf(mod) === 0) {
        return false;
      }
    }

    return true;
  });
};

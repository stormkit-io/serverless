import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import presets from "../../src/presets";

// Usage:
// ts-node run.ts --repo /path/to/repo --dist-dir ./dist
interface Args {
  repo: string;
  dist: string;
}

const argv: Args = yargs(hideBin(process.argv)).argv as unknown as Args;

(async () => {
  const artifacts = await presets({
    repoDir: argv.repo,
    distDir: argv.dist,
  });

  console.log(artifacts);
})();

import { TranslateData } from './models';
import { Resx } from './resx';
import { translate } from './translator';


const argv = require('yargs').argv

if (!argv.resourceDir) {
  console.error(`--resource-dir option must be specified`)
  process.exit(1);
}

if (!argv.srcDirs) {
	console.error(`--src-dirs option must be specified`)
	process.exit(1);
  }


const resx: Resx = new Resx(argv.resourceDir, argv.srcDirs);
async function main() {
	let refs = await resx.readData();
	refs = await resx.searchSources(refs);
	if (refs.unused.size > 0) {
		refs = await resx.removeUnused(refs);
	}	
}

main();
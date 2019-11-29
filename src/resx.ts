import * as fs from 'fs';

import { ResourceReferences } from './models';

const readdirp = require('readdirp');
const XML = require('pixl-xml');

export class Resx {

	constructor(public resourceDir: string, public srcDirs: string) {

	}

	readData(): Promise<ResourceReferences> {
		return new Promise((resolve) => {
			const files = fs.readdirSync(this.resourceDir);

			const origFiles = files.filter((file: string) => {
				if (file.match(/^\w+\.resx$/)) {
					return file;
				}
			});

			if (origFiles.length === 0) {
				return resolve(null);
			}
			const result: ResourceReferences = { unused: new Set<string>() };
			origFiles.forEach((file: string) => {
				const orig = XML.parse(fs.readFileSync(`${this.resourceDir}/${file}`), { preserveDocumentNode: true, preserveAttributes: true });
				const resourceName = file.split('.').shift();
				if (orig.root.data) {
					orig.root.data.forEach((item: any) => {
						const key = `${resourceName}.${item._Attribs.name}`;
						result.unused.add(key);
					});
				}

			});
			console.info(`Collected ${result.unused.size} resources`);
			resolve(result);
		});
	}

	searchSources(refs: ResourceReferences): Promise<ResourceReferences> {
		return new Promise(resolve => {
			const dirs = this.srcDirs.split(' ');
			return Promise.all(dirs.map(d => this.searchSrcDir(d, refs)))
				.then(() => {
					resolve(refs);
				});
		})

	}

	private searchSrcDir(dir: string, refs: ResourceReferences): Promise<ResourceReferences> {
		return new Promise(resolve => {
			console.info(`Reading ${dir}`);
			let files = 0;
			readdirp(dir, { fileFilter: ['*.ts', '*.html', '*.cs'], alwaysStat: true })
				.on('data', (entry) => {
					files++;
					const { fullPath, path, stats: { size } } = entry;
					const content = fs.readFileSync(fullPath, 'utf-8');
					const toRemove = [];
					refs.unused.forEach(key => {
						if (content.includes(key)) {
							toRemove.push(key);
						}
					});
					if (toRemove.length > 0) {
						//console.info(`${path} contains ${toRemove.length} resources`);
						toRemove.forEach(key => {
							refs.unused.delete(key)
						});
					}
				})
				// Optionally call stream.destroy() in `warn()` in order to abort and cause 'close' to be emitted
				.on('warn', error => console.error('non-fatal error', error))
				.on('error', error => console.error('fatal error', error))
				.on('end', () => {
					console.info(`Saw ${files} files. Remaining ${refs.unused.size} unused resources`);
					resolve(refs)
				});
		})
	}

	removeUnused(refs: ResourceReferences): Promise<any> {
		console.info('Removing unused resources');
		return new Promise(resolve => {
			const files = fs.readdirSync(this.resourceDir);

			const origFiles = files.filter((file: string) => {
				if (file.match(/^\w+\.resx$/)) {
					return file;
				}
			});

			if (origFiles.length === 0) {
				return resolve(null);
			}
			const result: ResourceReferences = { unused: new Set<string>() };
			const cleaned = origFiles.map((file: string) => {
				const others = this.getLanguageFiles(file, files);
				const filesToClean = [...others, file];
				return Promise.all(filesToClean.map(f => this.cleanupResourceFile(f, refs)));
			});
			Promise.all(cleaned).then(() => {
				resolve(result);			
			});
			
		});
	}

	private cleanupResourceFile(file: string, refs: ResourceReferences): Promise<any> {
		const res = file.split('.').shift()+'.';
		const toClean = Array.from(refs.unused.keys()).filter(k => k.startsWith(res)).map(k => k.substring(res.length));
		if (toClean.length === 0) {
			return Promise.resolve();
		}
		return new Promise(resolve => {
			const xml = XML.parse(fs.readFileSync(`${this.resourceDir}/${file}`), { preserveDocumentNode: true, preserveAttributes: true });
			if (xml.root.data) {
				xml.root.data = xml.root.data.filter(i => {
					return toClean.indexOf(i._Attribs.name) < 0;
				})
			}
			console.log(`Writing '${this.resourceDir}/${file}' translation file`);
			fs.writeFileSync(`${this.resourceDir}/${file}`, XML.stringify(xml));
		})
	}

	private getLanguageFiles(originalFile: string, files: string[]) {
		const noExt = originalFile.replace('.resx', '');
		return files.filter((file: string) => {
			if (file.startsWith(noExt) && file.endsWith('.resx') && file !== originalFile) {
				return file;
			}
		});
	}

}

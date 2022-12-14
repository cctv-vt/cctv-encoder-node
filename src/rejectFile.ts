import {logger} from './logger';
import {readdirSync, readFileSync, rename, writeFile} from 'fs';
import {rm} from 'fs/promises';

const cats: string[] = [];

function randomCat(): string {
	if (cats.length === 0) {
		readdirSync('error-cats').forEach(val => {
			cats.push(readFileSync('error-cats/' + val).toString());
			if (!val.includes('rare')) {
				cats.push(readFileSync('error-cats/' + val).toString());
				cats.push(readFileSync('error-cats/' + val).toString());
				cats.push(readFileSync('error-cats/' + val).toString());
			}
		});
	}

	return cats[Math.floor(Math.random() * cats.length)];
}

export function rejectFile(path: string, reason = 'No reason given'): void {
	const inputPath = `video-input/${path.split('/')[1]}`;
	const outputPath = `video-failed/${path.split('/')[1]}`;
	rm(inputPath)
		.then(() => {
			logger.warn(`Watch: file ${inputPath} has been removed`);
		})
		.catch(err => {
			logger.error(`Watch: file ${inputPath} has not been removed due to a system error`);
			logger.error(err);
		});
	// Disabled: rename(inputPath, outputPath, () => {
	// logger.warn(`file ${inputPath} has been moved to ${outputPath}`);
	// });
	writeFile(outputPath.split('.')[0] + '.txt', reason + '\n\n' + randomCat(), () => null);
}

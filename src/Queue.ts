/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {writeFile, writeFileSync, readFileSync, existsSync} from 'fs';
import {logger} from './logger';

export type VideoFile = {
	location: string;
	programName: string;
	date?: Date;
	bitrate?: string;
	resolution?: [string, string];
	framerate?: string;
	duration?: string;
};

// ANCHOR: Queue Class
// Queue Data structure definition
export class Queue {
	q: VideoFile[];
	file: string;
	constructor(options: {file: string}) {
		// The Queue class contains the contents of the queue and one option
		// specifying the file to save the queue to on the disk
		this.q = [];
		this.file = options.file;
		if (options.file) {
			if (existsSync(options.file)) {
				// If the filename specified during construction exists,
				// this syncs the queue on disk with the queue in program memory
				try {
					logger.info(`Queue: trying to read ${options.file}`);
					// TODO: implement type checking reading queue
					this.q = JSON.parse(readFileSync(options.file).toString());
					logger.info(`Queue: read file ${options.file}`);
				} catch {
					// If the file exists but contains malformed JSON, the queue is reset
					logger.warn(`Queue: ${options.file} does not contain valid json, reseting file`);
					writeFileSync(this.file, JSON.stringify(this.q));
				}
			} else {
				// If the file specified doesn't exist, this creates a new empty queue file
				writeFile(this.file, JSON.stringify(this.q), err => {
					if (err) {
						logger.error(err);
					}
				});
			}
		}
	}

	add(item: VideoFile) {
		// Adds an item to the queue
		this.q.push(item);
		this.updateFile();
	}

	recieve(): VideoFile {
		// Reemoves an item from the top of the queue and removes the entry
		const current: VideoFile = this.q.shift() || undefined;
		this.updateFile();
		return current;
	}

	print(): VideoFile[] {
		// Prints the full conents of the queue (array of strings)
		return this.q;
	}

	printPaths(): string[] {
		const paths: string[] = [];
		this.q.forEach(val => {
			paths.push(val.location);
		});
		return paths;
	}

	updateFile() {
		// All functions changing the queue should call this function to update the queue file
		if (this.file) {
			writeFileSync(this.file, JSON.stringify(this.q));
		}
	}
}

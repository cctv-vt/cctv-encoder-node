/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import winston, {createLogger} from 'winston';
const {combine, timestamp, printf} = winston.format;
import chok from 'chokidar';
import ffmpeg from 'ffmpeg';
import {writeFile, writeFileSync, readFileSync, existsSync, renameSync, fstat, unlink} from 'fs';

// ANCHOR: Logging

// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
const textLogFormat = printf(({level, message, timestamp}) => `${timestamp} ${level}: ${message}`);

const logger = createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		//
		// Write all logs with importance level of `error` or less to `error.log`
		// Write all logs with importance level of `info` or less to `combined.log`
		//
		new winston.transports.File({filename: 'error.log', level: 'error'}),
		new winston.transports.File({filename: `logs/${new Date().getFullYear()}-${new Date().getMonth()}-combined.log`, format: combine(
			timestamp(),
			textLogFormat,
		)}),
		// Write all logs to console
		new winston.transports.Console({format: combine(
			timestamp({format: 'YYYY-MM-DD HH:mm:ss Z'}),
			winston.format.cli(),
			textLogFormat,
		),

		}),
	],
});

// ANCHOR: Queue

// Queue Data structure definition
class Queue {
	q: string[];
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

	add(item: string) {
		// Adds an item to the queue
		this.q.push(item);
		this.updateFile();
	}

	recieve(): string {
		// Reemoves an item from the top of the queue and removes the entry
		const current: string = this.q.shift() || '';
		this.updateFile();
		return current;
	}

	print(): string[] {
		// Prints the full conents of the queue (array of strings)
		return this.q;
	}

	updateFile() {
		// All functions changing the queue should call this function to update the queue file
		if (this.file) {
			writeFileSync(this.file, JSON.stringify(this.q));
		}
	}
}

const encodeQueue = new Queue({file: './queue.json'});

// Setup for the watch folder
// TODO: add an option for the input directory to the config file
chok.watch('./video-input').on('add', (path: string) => {
	logger.info(`Watch: ${path} has been seen in the watch folder`);
	if (/^.*\.mp4$/.test(path)) {
		// If the file matches the mp4 rejex try to add it to the queue
		console.log(encodeQueue.print().includes(path));
		if (encodeQueue.print().includes(path)) {
			// If the file is in the queue already it will not be added again
			logger.warn(`Watch: ${path} is already in the queue, ignoring`);
		} else {
			// The file is added to the queue here
			encodeQueue.add(path);
			logger.info(`Watch: ${path} has been added to the queue`);
		}
	} else {
		// If the file is not an mp4 it will be ignored
		logger.warn(`Watch: ${path} is not an mp4, ignoring`);
	}
});

// ANCHOR: Encode

let emptyQueue: boolean;

const tryEncode = () => {
	// The function waits for this many milliseconds
	// before re checking the queue if it is empty
	const ms = 500;
	if (encodeQueue.print().length) {
		// If the queue has any files in it try to encode them
		emptyQueue = false;
		const currentFile: string = encodeQueue.recieve();
		const currentFileName: string = currentFile.split('/')[1];
		logger.info(`Encoder: found ${currentFile} at front of queue`);
		// eslint-disable-next-line new-cap, no-new
		new ffmpeg(currentFile, (err: Error, video) => {
			if (err) {
				// If ffmpeg fails to open the file the error will be printed to the console,
				// and the program will continue
				console.log('error');
				console.log(err);
				console.log(video);
				logger.error(`Error: error opening ${currentFile} with ffmpeg`);
				tryEncode();
			} else {
				// Encode the file
				logger.info(`Encoder: ${currentFile} opened with ffmpeg`);
				console.log(video.metadata);
				// TODO: add all used encoder options to the config file
				video
					.setVideoSize('?x720')
					// TODO: add an option for the output directory to the config file
					.save(`video-output/${currentFileName}`, (err, file: string) => {
						if (err) {
							logger.error(err);
							console.log(err);
						} else {
							logger.info(`Encoder: encoded file: ${file}`);
							unlink(currentFile, () => { // Delete the oold file after the encode complets succesfully
								logger.info(`Encoder: ${currentFile} removed`);
							});
							// Rerun function
							tryEncode();
						}
					});
			}
		});
	} else {
		// If the queue is empty, wait (ms) milliseconds and retry
		if (!emptyQueue) {
			// If the queue was empty last time the function was run it will not log 'nothing in queue'
			// to keep the logs clean/readable
			logger.info('Encoder: nothing in queue');
			emptyQueue = true;
		}

		logger.verbose(`Encoder: nothing in queue, retrying in ${ms}ms`);
		setTimeout(() => {
			// Waiting period (ms) to avoid blocking
			tryEncode();
		}, ms);
	}
};

tryEncode();

// ANCHOR: Upload

const gcsUpload = (file: string) => {
	// TODO: Implement Google Cloud Storage Upload
	logger.warn(`GCS Upload: Not Implemented (${file})`);
};

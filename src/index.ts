/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import winston, {createLogger} from 'winston';
const {combine, timestamp, printf} = winston.format;
import chok from 'chokidar';
import {tryEncode} from './tryEncode';
import {Queue} from './Queue';

// ANCHOR: Logging

// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
const textLogFormat = printf(({level, message, timestamp}) => `${timestamp} ${level}: ${message}`);

export const logger = createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		//
		// Write all logs with importance level of `error` or less to `error.log`
		// Write all logs with importance level of `info` or less to `combined.log`
		//
		new winston.transports.File({filename: 'logs/error.log', level: 'error'}),
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

export const encodeQueue = new Queue({file: './queue.json'});

// Setup for the watch folder
// TODO: add an option for the input directory to the config file
chok.watch('./video-input').on('add', (path: string) => {
	logger.info(`Watch: ${path} has been seen in the watch folder`);
	if (/^.*\.mp4$/.test(path)) {
		// If the file matches the mp4 rejex try to add it to the queue
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

tryEncode();

// ANCHOR: Upload

const gcsUpload = (file: string) => {
	// TODO: Implement Google Cloud Storage Upload
	logger.warn(`GCS Upload: Not Implemented (${file})`);
	// Upload Files
	// Remove Files from local disk after upload is successful
};

// TODO: Implement api

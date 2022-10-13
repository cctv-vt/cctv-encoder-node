
import chok from 'chokidar';
import {tryEncode} from './tryEncode';
import {Queue} from './Queue';
import {logger} from './logger';
import {ApiVideo, initializeApi} from './api';
import {processFile} from './processFile';
import {uploadFolder} from './gcsUpload';
import {rejectFile} from './util';

const encodeQueue: Queue = new Queue({file: './queue.json'});

const currentEncode: ApiVideo = new ApiVideo({
	location: '',
	programName: '',
});

const currentUpload: ApiVideo = new ApiVideo({
	location: '',
	programName: '',
});

// Setup for the watch folder
// TODO: add an option for the input directory to the config file
chok.watch('./video-input').on('add', (path: string) => {
	logger.info(`Watch: ${path} has been seen in the watch folder`);
	if (/^.*\.mp4$/.test(path)) {
		// If the file matches the mp4 rejex try to add it to the queue
		if (encodeQueue.printPaths().includes(path)) {
			// If the file is in the queue already it will not be added again
			logger.warn(`Watch: ${path} is already in the queue, ignoring`);
		} else {
			// The file is added to the queue here
			processFile(path).then(videoFile => {
				encodeQueue.add(videoFile);
				logger.info(`Watch: ${path} has been added to the queue`);
			}).catch((err: Error) => {
				logger.warn(`Watch: ${err.message}`);
				rejectFile(path, `Rejected by file watcher/data extraction: ${err.message}`);
			});
			// TODO: Move file to rejected folder
		}
	} else {
		// If the file is not an mp4 it will be ignored
		logger.warn(`Watch: ${path} is not an mp4, ignoring`);
		rejectFile(path, 'Rejected by file watcher/data extraction: not a ".mp4"');
	}
});

// ANCHOR: Encode

// Attempts to run encoder function on queue
// tryEncode(encodeQueue, currentEncode);

// The function waits for this many milliseconds
// before re checking the queue if it is empty
let emptyQueue: boolean;
const ms = 500;

const encode = () => {
	if (encodeQueue.print().length) {
	// If the queue has any files in it try to encode them
		emptyQueue = false;
		tryEncode(encodeQueue, currentEncode, (video, err) => {
			if (err) {
				logger.error(`Encoder: ${err.message}`);
				encode();
			} else {
				console.log(video);
				uploadFolder(`video-output/${video.programName}`, video, currentUpload)
					.then((val: string) => {
						currentUpload.clear();
						logger.info(`Upload: finished uplooading ${val}`);
					})
					.catch((err: Error) => {
						console.log(err);
						logger.error(`Upload: ${err.message}`);
					});
				encode();
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
			encode();
		}, ms);
	}
};

encode();

// ANCHOR: API

initializeApi(currentEncode, currentUpload, encodeQueue);


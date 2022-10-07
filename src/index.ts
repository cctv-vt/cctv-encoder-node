
import chok from 'chokidar';
import {tryEncode} from './tryEncode';
import {Queue} from './Queue';
import {logger} from './logger';
import {ApiCurrentEncode, initializeApi} from './api';

const encodeQueue: Queue = new Queue({file: './queue.json'});

const currentEncode = new ApiCurrentEncode();

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

// Attempts to run encoder function on queue
tryEncode(encodeQueue, currentEncode);

// ANCHOR: Upload

const gcsUpload = (file: string) => {
	// TODO: Implement Google Cloud Storage Upload
	logger.warn(`GCS Upload: Not Implemented (${file})`);
	// Upload Files
	// Remove Files from local disk after upload is successful
};

// TODO: Implement api

initializeApi(currentEncode, encodeQueue);

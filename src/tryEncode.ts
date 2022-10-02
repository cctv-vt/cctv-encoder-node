import fluent from 'fluent-ffmpeg';
import {unlink} from 'fs';
import {encodeQueue, logger} from './index';

export let emptyQueue: boolean;

export function tryEncode(): void {
	// The function waits for this many milliseconds
	// before re checking the queue if it is empty
	const ms = 500;
	if (encodeQueue.print().length) {
		// If the queue has any files in it try to encode them
		emptyQueue = false;
		const currentFile: string = encodeQueue.recieve();
		const currentFileName: string = currentFile.split('/')[1];
		logger.info(`Encoder: found ${currentFile} at front of queue`);
		fluent(currentFile)
			.native()
			.size('?x720')
			.on('codecData', data => {
				console.log(data);
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				logger.info(`Encoder: input file is ${data.video} at resolution ${data.video_details[2]}`);
			})
			.on('start', (command: string) => {
				logger.info(`Encoder: ffmpeg started with the command: ${command}`);
			})
			.on('end', () => {
				logger.info(`Encoder: successfuly encoded ${currentFileName}`);
				unlink(currentFile, () => {
					logger.info(`Encoder: removed file ${currentFile}`);
				});
				// Rerun function
				tryEncode();
			})
			.save(`video-output/${currentFileName}`);
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
}

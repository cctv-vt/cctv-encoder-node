import type {FfprobeData} from 'fluent-ffmpeg';
import fluent, {Codec} from 'fluent-ffmpeg';
import {existsSync, mkdirSync, unlink} from 'fs';
import type {Queue} from './Queue';
import {logger} from './logger';
import type {ApiCurrentEncode} from './api';
import {resolve} from 'path';

let emptyQueue: boolean;

// This should run forever
export function tryEncode(queue: Queue, currentEncode: ApiCurrentEncode): void {
	// The function waits for this many milliseconds
	// before re checking the queue if it is empty
	const ms = 500;
	if (queue.print().length) {
		// If the queue has any files in it try to encode them
		emptyQueue = false;
		const currentFile: string = queue.recieve();
		const currentFileName: string = currentFile
			.split('/')[1]
			.split('.')[0];
		logger.info(`Encoder: found ${currentFile} at front of queue`);
		if (!existsSync(`video-output/${currentFileName}/`)) {
			mkdirSync(`video-output/${currentFileName}/`);
		}

		const videoData = new Promise<void>((resolve, reject) => {
			currentEncode.filename = currentFileName;
			fluent(currentFile)
				.ffprobe((err, data: FfprobeData) => {
					if (err) {
						reject(err);
					}

					console.dir(data);
					currentEncode.inputDuration = data.streams[0].duration;
					currentEncode.inputFramerate = (data.streams[0].avg_frame_rate);
					currentEncode.inputResolution = `${data.streams[0].width}x${data.streams[0].height}`;
					currentEncode.inputBitrate = (parseInt(data.streams[0].bit_rate, 10) / 10).toString();
					resolve();
				});
		});

		const videoEncode = new Promise<void>((resolve, reject) => {
			try {
				fluent(currentFile)
					.native()
					.size('?x720')
					.videoBitrate(1000)
					.on('start', (command: string) => {
						logger.info(`Encoder: ffmpeg started with the command: ${command}`);
					})
					.on('end', () => {
						logger.info(`Encoder: successfuly encoded ${currentFileName}.broadband.mp4`);
						resolve();
					})
					.save(`video-output/${currentFileName}/${currentFileName}.broadband.mp4`);
			} catch (error: unknown) {
				reject(error);
			}
		});
		const thumbnailEncode = new Promise<void>((resolve, reject) => {
			try {
				fluent(currentFile)
					.screenshots({
						timestamps: ['0.1%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%'],
						filename: `video-output/${currentFileName}/${currentFileName}.%i.jpg`,
					})
					.on('end', tn => {
						logger.info(`Encoder: Pulled thumbnails for ${currentFileName}`);
						console.log(tn);
						resolve();
					});
			} catch (error: unknown) {
				reject(error);
			}
		});
		const thumbnailEncodeSmall = new Promise<void>((resolve, reject) => {
			try {
				fluent(currentFile)
					.screenshots({
						size: '160x90',
						timestamps: ['0.1%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%'],
						filename: `video-output/${currentFileName}/${currentFileName}.%i.tn.jpg`,
					})
					.on('end', tn => {
						logger.info(`Encoder: Pulled thumbnails for ${currentFileName}`);
						console.log(tn);
						resolve();
					});
			} catch (error: unknown) {
				reject(error);
			}
		});
		Promise.all([videoData, videoEncode, thumbnailEncode, thumbnailEncodeSmall]).then(() => {
			currentEncode.clear();
			logger.info(`Encoder: all ffmpeg processes for ${currentFileName} have completed`);
			unlink(currentFile, () => {
				logger.info(`Encoder: removed file ${currentFile}`);
			});
			tryEncode(queue, currentEncode);
		}).catch((reason: Error) => {
			console.log(reason);
			logger.error('Encoder: video encode failed');
		}).catch((reason: Error) => {
			console.log(reason);
			logger.error('Encoder: thumbnail encode failed');
		}).finally(() => {
			tryEncode(queue, currentEncode);
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
			tryEncode(queue, currentEncode);
		}, ms);
	}
}

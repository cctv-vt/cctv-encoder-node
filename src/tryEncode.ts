import type {FfprobeData} from 'fluent-ffmpeg';
import fluent, {Codec} from 'fluent-ffmpeg';
import {existsSync, mkdirSync, unlink} from 'fs';
import type {Queue, VideoFile} from './Queue';
import {logger} from './logger';
import type {ApiCurrentEncode} from './api';

// This should run forever
export function tryEncode(queue: Queue, currentEncode: ApiCurrentEncode, callback: () => void): void {
	const currentFile: VideoFile = queue.recieve();
	currentEncode.update(currentFile);
	logger.info(`Encoder: found ${currentFile.location} at front of queue`);
	if (!existsSync(`video-output/${currentFile.programName}/`)) {
		mkdirSync(`video-output/${currentFile.programName}/`);
	}

	const videoEncode = new Promise<void>((resolve, reject) => {
		try {
			fluent(currentFile.location)
				.native()
				.size('?x720')
				.videoBitrate(1000)
				.on('start', (command: string) => {
					logger.info(`Encoder: ffmpeg started with the command: ${command}`);
				})
				.on('end', () => {
					logger.info(`Encoder: successfuly encoded ${currentFile.programName}.broadband.mp4`);
					resolve();
				})
				.save(`video-output/${currentFile.programName}/${currentFile.programName}.broadband.mp4`);
		} catch (error: unknown) {
			reject(error);
		}
	});
	const thumbnailEncode = new Promise<void>((resolve, reject) => {
		try {
			fluent(currentFile.location)
				.screenshots({
					timestamps: ['0.1%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%'],
					filename: `video-output/${currentFile.programName}/${currentFile.programName}.%i.jpg`,
				})
				.on('end', tn => {
					logger.info(`Encoder: Pulled thumbnails for ${currentFile.programName}`);
					console.log(tn);
					resolve();
				});
		} catch (error: unknown) {
			reject(error);
		}
	});
	const thumbnailEncodeSmall = new Promise<void>((resolve, reject) => {
		try {
			fluent(currentFile.location)
				.screenshots({
					size: '160x90',
					timestamps: ['0.1%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%'],
					filename: `video-output/${currentFile.programName}/${currentFile.programName}.%i.tn.jpg`,
				})
				.on('end', tn => {
					logger.info(`Encoder: Pulled thumbnails for ${currentFile.programName}`);
					console.log(tn);
					resolve();
				});
		} catch (error: unknown) {
			reject(error);
		}
	});
	Promise.all([videoEncode, thumbnailEncode, thumbnailEncodeSmall]).then(() => {
		currentEncode.clear();
		logger.info(`Encoder: all ffmpeg processes for ${currentFile.programName} have completed`);
		unlink(currentFile.location, () => {
			logger.info(`Encoder: removed file ${currentFile.location}`);
		});
		// TryEncode(queue, currentEncode);
	}).catch((reason: Error) => {
		console.log(reason);
		logger.error('Encoder: video encode failed');
	}).catch((reason: Error) => {
		console.log(reason);
		logger.error('Encoder: thumbnail encode failed');
	}).finally(() => {
		// TryEncode(queue, currentEncode);
		callback();
	});
}

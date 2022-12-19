import type {FfprobeData} from 'fluent-ffmpeg';
import fluent, {Codec} from 'fluent-ffmpeg';
import {existsSync, mkdirSync, unlink} from 'fs';
import type {Queue, VideoFile} from './Queue';
import {logger} from './logger';
import type {ApiVideo} from './api';
import type {ConfigType} from './config';
import {defaultConfig} from './config';

// This should run forever
export function tryEncode(queue: Queue, currentEncode: ApiVideo, config: ConfigType, callback: (file: VideoFile, err: Error) => void): void {
	const outputFolder = config.watch.outputFolder || defaultConfig.watch.outputFolder;
	const currentFile: VideoFile = queue.recieve();
	currentEncode.update(currentFile);
	logger.info(`Encoder: found ${currentFile.location} at front of queue`);
	if (!existsSync(`${outputFolder}/${currentFile.programName}/`)) {
		mkdirSync(`${outputFolder}/${currentFile.programName}/`);
	}

	const videoEncode = new Promise<void>((resolve, reject) => {
		currentEncode.progressUpdate('video', 0);
		try {
			fluent(currentFile.location)
				.native()
				.size(config.encode.size || defaultConfig.encode.size)
				.videoBitrate(config.encode.bitrate || defaultConfig.encode.bitrate)
				.on('start', (command: string) => {
					logger.info(`Encoder: ffmpeg started with the command: ${command}`);
				})
				.on('progress', progress => {
					currentEncode.progressUpdate('video', progress.percent / 100);
				})
				.on('end', () => {
					logger.info(`Encoder: successfuly encoded ${currentFile.programName}.broadband.mp4`);
					currentEncode.progressUpdate('video', 1);
					resolve();
				})
				.save(`${outputFolder}/${currentFile.programName}/${currentFile.programName}.broadband.mp4`);
		} catch (error: unknown) {
			reject(error);
		}
	});
	const thumbnailEncode = new Promise<void>((resolve, reject) => {
		currentEncode.progressUpdate('screenshotsBig', 0);
		try {
			fluent(currentFile.location)
				.screenshots({
					size: '960x540',
					timestamps: config.encode.thumbnailTimestamps || defaultConfig.encode.thumbnailTimestamps,
					filename: `${outputFolder}/${currentFile.programName}/${currentFile.programName}.%i.jpg`,
				})
				.on('progress', progress => {
					currentEncode.progressUpdate('screenshotsBig', progress.percent / 100);
				})
				.on('end', tn => {
					logger.info(`Encoder: Pulled thumbnails for ${currentFile.programName}`);
					currentEncode.progressUpdate('screenshotsBig', 1);
					resolve();
				});
		} catch (error: unknown) {
			reject(error);
		}
	});
	const thumbnailEncodeSmall = new Promise<void>((resolve, reject) => {
		currentEncode.progressUpdate('screenshotsSmall', 0);
		try {
			fluent(currentFile.location)
				.screenshots({
					size: '160x90',
					timestamps: ['0.1%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '99.5%'],
					filename: `${outputFolder}/${currentFile.programName}/${currentFile.programName}.%i.tn.jpg`,
				})
				.on('progress', progress => {
					currentEncode.progressUpdate('screenshotsSmall', progress.percent / 100);
				})
				.on('end', tn => {
					logger.info(`Encoder: Pulled thumbnails (small) for ${currentFile.programName}`);
					currentEncode.progressUpdate('screenshotsSmall', 1);
					resolve();
				});
		} catch (error: unknown) {
			reject(error);
		}
	});
	Promise.all([thumbnailEncode, thumbnailEncodeSmall, videoEncode]).then(() => {
		currentEncode.clear();
		currentEncode.progressClear();
		logger.info(`Encoder: all ffmpeg processes for ${currentFile.programName} have completed`);
		unlink(currentFile.location, () => {
			logger.info(`Encoder: removed file ${currentFile.location}`);
		});
		// TryEncode(queue, currentEncode);
	}).catch((reason: Error) => {
		console.log(reason);
		logger.error('Encoder: video encode failed');
		callback(currentFile, reason);
	}).finally(() => {
		// TryEncode(queue, currentEncode);
		callback(currentFile, null);
	});
}

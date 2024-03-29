// Imports the Google Cloud client library
import {Storage} from '@google-cloud/storage';
import type {UploadOptions} from '@google-cloud/storage';
import {readdirSync, statSync} from 'fs';
import type {VideoFile} from './Queue';
import {logger} from './logger';
import type {ApiVideo} from './api';
import type {ConfigType} from './config';
import {defaultConfig} from './config';
import {Config} from './config';

export async function gcsUploadFolder(folder: string, videoFile: VideoFile, currentUpload: ApiVideo, config: ConfigType): Promise<string> {
	// Get Values From config
	// bucketName is redefined every time allowing for changes during runtime
	const keyFilename = config.gcsUpload.keyFile || defaultConfig.gcsUpload.keyFile;
	const bucketName = config.gcsUpload.bucketName || defaultConfig.gcsUpload.bucketName;
	logger.info(`GCS Upload: Google bucket set to ${bucketName}`);
	const storage = new Storage({keyFilename});
	return new Promise((resolve, reject) => {
		const fileUploads = [];
		readdirSync(folder).forEach(file => {
			const fileSize = statSync(`${folder}/${file}`).size;
			currentUpload.progressUpdate(file, 0);
			fileUploads.push(new Promise((resolve, reject) => {
				let destination: string;
				if (videoFile.date) {
					const date = new Date(videoFile.date);
					const {programName} = videoFile;
					destination = `cctv/library/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${programName}/${file}`;
				}

				const onUploadProgress = (ev: any): void => {
					currentUpload.progressUpdate(file, ev.bytesWritten / fileSize);
				};

				const options: UploadOptions = {
					destination,
					onUploadProgress,
				};
				storage.bucket(bucketName).upload(`${folder}/${file}`, options)
					.then(val => {
						currentUpload.progressUpdate(file, 1);
						resolve(val);
					})
					.catch(reject);
			}));
		});
		logger.info(`GCS Upload: Uploading ${fileUploads.length} files from ${videoFile.programName}`);
		Promise.all(fileUploads)
			.then(() => {
				currentUpload.progressClear();
				resolve(videoFile.programName);
			})
			.catch(reject);
	});
}

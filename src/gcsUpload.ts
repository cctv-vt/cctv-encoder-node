// Imports the Google Cloud client library
import {Storage} from '@google-cloud/storage';
import type {UploadOptions} from '@google-cloud/storage';
import {readdirSync, statSync} from 'fs';
import type {VideoFile} from './Queue';
import {logger} from './logger';
import type {ApiVideo} from './api';

// TODO: Add to Config
// TODO: Dont use this bucket for production!!!
const bucketName = 'cctv-library-test';

// Creates a client
const storage = new Storage({keyFilename: 'key.json'});

export async function uploadFolder(folder: string, videoFile: VideoFile, currentUpload: ApiVideo): Promise<unknown> {
	return new Promise((resolve, reject) => {
		console.log(folder);
		const fileUploads = [];
		readdirSync(folder).forEach(file => {
			const fileSize = statSync(`${folder}/${file}`).size;
			console.log(file, fileSize);
			fileUploads.push(new Promise((resolve, reject) => {
				console.log(file);
				let destination: string;
				if (videoFile.date) {
					const {date, programName} = videoFile;
					destination = `cctv/library/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${programName}/${file}`;
				}

				const onUploadProgress = (ev: any): void => {
					currentUpload.uploadProgressUpdate(file, ev.bytesWritten / fileSize);
				};

				console.log(destination);
				const options: UploadOptions = {
					destination,
					onUploadProgress,
				};
				console.log(currentUpload);
				storage.bucket(bucketName).upload(`${folder}/${file}`, options)
					.then(resolve)
					.catch(reject);
			}));
		});
		console.log(fileUploads);
		logger.info(`Upload: Uploading ${fileUploads.length} files from ${videoFile.programName}`);
		Promise.all(fileUploads)
			.then(val => {
				resolve(videoFile.programName);
			})
			.catch(reject);
	});
}

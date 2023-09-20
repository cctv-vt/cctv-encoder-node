/* eslint-disable @typescript-eslint/naming-convention */
import type {S3Client} from '@aws-sdk/client-s3';
import {PutObjectCommand, S3} from '@aws-sdk/client-s3';
import type {VideoFile} from './Queue';
import {logger} from './logger';
import type {ApiVideo} from './api';
import type {ConfigType} from './config';
import {defaultConfig} from './config';
import {Config} from './config';
import {resolve} from 'path';
import {readdir} from 'fs/promises';
import {readFileSync, readdirSync, statSync} from 'fs';

// TODO: Add generic s3 upload

export async function s3Upload(folder: string, videoFile: VideoFile, currentUpload: ApiVideo, config: ConfigType): Promise<string> {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const s3Config = JSON.parse(readFileSync('./conf/s3Config.json', 'utf-8'));
	const s3 = new S3(s3Config);
	return new Promise((resolve, reject) => {
		const fileUploads = [];
		readdirSync(folder).forEach(file => {
			const fileSize = statSync(`${folder}/${file}`).size;
			currentUpload.progressUpdate(file, 0);
			fileUploads.push(uploadFile(file, s3, videoFile));
		});
	});
}

async function uploadFile(file: string, s3: S3Client, videoFile: VideoFile, apiVideo: ApiVideo): Promise<string> {
	// TODO: Use Config

	let destination: string;
	if (videoFile.date) {
		const date = new Date(videoFile.date);
		const {programName} = videoFile;
		destination = `cctv/library/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${programName}/${file}`;
	}
	// TODO: add progress indicator

	await s3.send(new PutObjectCommand(
		{
			Bucket: 'cctv-media',
			Body: file,
			Key: destination,
		},
	));
	apiVideo.progressUpdate(file, 1);
	return 'success';
}

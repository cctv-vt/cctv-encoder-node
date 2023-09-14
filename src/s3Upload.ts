import {S3Client} from '@aws-sdk/client-s3';
import type {VideoFile} from './Queue';
import {logger} from './logger';
import type {ApiVideo} from './api';
import type {ConfigType} from './config';
import {defaultConfig} from './config';
import {Config} from './config';

//TODO: Add generic s3 upload

export async function s3Upload(folder: string, videoFile: VideoFile, currentUpload: ApiVideo, config: ConfigType): Promise<string> {
	return 'this function doesnt do anything';
}

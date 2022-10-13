import express from 'express';
import {logger} from './logger';
import type {Queue, VideoFile} from './Queue';

const app: express.Application = express();

export const updateApi = () => {
	console.log('update :p');
};

export class ApiVideo {
	vid: VideoFile;
	uploadProgress: [{
		file: string;
		progress: number;
	}?];

	constructor(videoFile: VideoFile) {
		this.vid = videoFile;
		this.uploadProgress = [];
	}

	update(videoFile: VideoFile) {
		this.vid = videoFile;
	}

	uploadProgressUpdate(file: string, progress: number) {
		const {uploadProgress} = this;
		const value = uploadProgress.find(val => val.file === file);
		if (value) {
			value.progress = progress;
		} else {
			uploadProgress.push({file, progress});
		}
	}

	uploadProgressClear() {
		this.uploadProgress = [];
	}

	uploadProgressRead() {
		return this.uploadProgress;
	}

	clear() {
		this.vid = {
			location: '',
			programName: '',
		};
	}

	read(): VideoFile {
		return this.vid;
	}
}

export const initializeApi = (currentEncode: ApiVideo, currentUpload: ApiVideo, queue: Queue) => {
	app.get('/api/encode', (_req, res) => {
		res.send(currentEncode.read());
	});

	app.get('/api/upload', (_req, res) => {
		res.send(currentUpload.read());
	});

	app.get('/api/queue', (_req, res) => {
		res.send(
			queue.print(),
		);
	});

	app.listen('3000', () => {
		logger.info('API: Listening on port 3000');
	});
};

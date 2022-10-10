import express from 'express';
import {logger} from './logger';
import type {Queue, VideoFile} from './Queue';

const app: express.Application = express();

export const updateApi = () => {
	console.log('update :p');
};

export class ApiCurrentEncode {
	vid: VideoFile;

	constructor(videoFile: VideoFile) {
		this.vid = videoFile;
	}

	update(videoFile: VideoFile) {
		this.vid = videoFile;
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

export const initializeApi = (currentEncode: ApiCurrentEncode, queue: Queue) => {
	app.get('/api/current', (_req, res) => {
		res.send(currentEncode.read());
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

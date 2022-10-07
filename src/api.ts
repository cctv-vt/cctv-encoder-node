import express from 'express';
import {logger} from './logger';
import type {Queue} from './Queue';

const app: express.Application = express();

export const updateApi = () => {
	console.log('update :p');
};

export class ApiCurrentEncode {
	filename = '';
	inputResolution = '';
	inputFramerate = '';
	inputDuration = '';
	inputBitrate = '';

	// C update({filename = '', inputResolution = '', inpu}) {
	// 	// Fill
	// }

	clear() {
		this.filename = '';
		this.inputResolution = '';
		this.inputFramerate = '';
		this.inputDuration = '';
		this.inputBitrate = '';
	}

	read() {
		return {
			filename: this.filename,
			inputResolution: this.inputResolution,
			inputFramerate: this.inputFramerate,
			inputDuration: this.inputDuration,
			inputBitrate: this.inputBitrate,
		};
	}
}

export const initializeApi = (currentEncode: ApiCurrentEncode, queue: Queue) => {
	app.get('/api/current', (_req, res) => {
		res.send(
			currentEncode.read(),
		);
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

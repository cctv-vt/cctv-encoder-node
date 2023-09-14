import EventEmitter from 'events';
import express from 'express';
import {WebSocketServer} from 'ws';
import {logger} from './logger';
import type {Queue, VideoFile} from './Queue';

export const updateApi = () => {
	console.log('update :p');
};

type Progress = [{
	component: string;
	progress: number;
}?];

export class ApiVideo extends EventEmitter {
	vid: VideoFile;

	progress: Progress;

	eventEmitter = new EventEmitter();

	constructor(videoFile: VideoFile) {
		super();
		this.vid = videoFile;
		this.progress = [];
		this.updateEvent();
		this.progressUpdateEvent();
	}

	update(videoFile: VideoFile) {
		this.vid = videoFile;
		this.updateEvent();
	}

	clear() {
		this.vid = {
			location: '',
			programName: '',
		};
		this.updateEvent();
	}

	read(): VideoFile {
		return this.vid;
	}

	progressUpdate(component: string, progress: number) {
		const {progress: uploadProgress} = this;
		const value = uploadProgress.find(val => val.component === component);
		if (value) {
			value.progress = progress;
		} else {
			uploadProgress.push({component, progress});
		}

		this.progressUpdateEvent();
	}

	progressClear() {
		this.progress = [];
		this.progressUpdateEvent();
	}

	progressRead() {
		return this.progress;
	}

	private updateEvent() {
		this.emit('update', this.vid);
	}

	private progressUpdateEvent() {
		this.emit('progress', this.progress);
	}
}

export const initializeApi = (currentEncode: ApiVideo, currentGcsUpload: ApiVideo, queue: Queue) => {
	const app = express();
	app.get('/api/encode', (_req, res) => {
		res.send({
			video: currentEncode.read(),
			progress: currentEncode.progressRead(),
		});
	});

	app.get('/api/gcsupload', (_req, res) => {
		res.send({
			video: currentGcsUpload.read(),
			progress: currentGcsUpload.progressRead(),
		});
	});

	app.get('/api/queue', (_req, res) => {
		res.send(
			queue.print(),
		);
	});

	app.listen('3000', () => {
		logger.info('API: Listening on port 3000');
	});

	const wss = new WebSocketServer({
		port: 4000,
		path: '/api/ws',
	});

	wss.on('connection', ws => {
		console.log(ws.url);
		ws.send('hell0');
		console.log('test');
		currentEncode.on('update', (currentEncode: VideoFile) => {
			ws.send(JSON.stringify({
				message: 'currentEncode',
				data: currentEncode,
			}));
		});

		currentGcsUpload.on('update', (currentUpload: VideoFile) => {
			ws.send(JSON.stringify({
				message: 'currentUpload',
				data: currentUpload,
			}));
		});

		currentEncode.on('progress', (encodeProgress: Progress) => {
			ws.send(JSON.stringify({
				message: 'currentEncodeProgress',
				data: encodeProgress,
			}));
		});

		currentGcsUpload.on('progress', (uploadProgress: Progress) => {
			ws.send(JSON.stringify({
				message: 'currentUploadProgress',
				data: uploadProgress,
			}));
		});
	});
};

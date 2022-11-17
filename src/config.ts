
export type ConfigType = {
	watch?: {
		inputFolder?: string;
		outputFolder?: string;
		regex?: RegExp;
	};
	queue?: {
		file?: string;
	};
	encode?: {
		size?: string;
		bitrate?: number;
		thumbnailTimestamps?: string[];
	};
	gcsUpload?: {
		bucketName?: string;
		path?: string;
		keyFile?: string;
	};
	api?: {
		httpPort?: number;
		wsPort?: number;
	};
	config?: {
		filename?: string;
	};
};

import {existsSync, readFileSync, writeFileSync} from 'fs';
import {load, dump} from 'js-yaml';
import {logger} from './logger';

export const defaultConfig: ConfigType = {
	watch: {
		inputFolder: './video-input',
		outputFolder: './video-output',
		regex: /^[A-z,-,_,0-9]*_F_[0-9]{8}$/,
	},
	queue: {
		file: './queue.json',
	},
	encode: {
		size: '?x720',
		bitrate: 1000,
		thumbnailTimestamps: ['0.1%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '99.5%'],
	},
	gcsUpload: {
		bucketName: 'cctv-library-test',
		keyFile: './conf/key.json',
		path: 'cctv/library/',
	},
	api: {
		httpPort: 3000,
		wsPort: 4000,
	},
	config: {
		filename: 'config.json',
	},
};

export class Config {
	config: ConfigType | undefined;

	constructor() {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			this.config = JSON.parse(readFileSync('conf/config.json', 'utf-8'));
		} catch {
			logger.info('Logger: Config file doesn\'t exist, creating');
			writeFileSync('conf/config.json', JSON.stringify(defaultConfig));
			this.config = defaultConfig;
		}
		// Individual components should store their own defaults
	}

	print(): ConfigType {
		return this.config;
	}
}

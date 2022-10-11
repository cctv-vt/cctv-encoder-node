import type {VideoFile} from './Queue';
import type {FfprobeData} from 'fluent-ffmpeg';
import fluent from 'fluent-ffmpeg';
import {logger} from './logger';

export async function processFile(path: string): Promise<VideoFile> {
	// Returns a promise so that data can be collected for the
	// api/upload process before the file is added to the queue
	return new Promise<VideoFile>((resolve, reject) => {
		try {
			console.log('Processing');
			const info: VideoFile = {
				location: path,
				programName: path.split('/')[1].split('.')[0],
				// Program name is derived from the name of the location after the last / and before the first .
			};
			const regexp = /^.*_F_[0-9]*$/;
			console.log(info.programName);
			if (regexp.test(info.programName)) {
				// If the program name is valid contruct the date
				logger.info(`File Data: ${info.location} passed regexp`);
				const dateString = info.programName.split('_F_')[1];
				const year = dateString.slice(4, dateString.length);
				const month = dateString.slice(0, 2);
				const day = dateString.slice(2, 4);
				// Construct date using YYYY-MM-D format
				info.date = new Date(`${year}-${month}-${day}`);
			} else {
				throw (new Error(`File ${info.location} does not match program name regexp`));
			}

			// Ffprobe is used to extract video data
			fluent(info.location)
				.ffprobe((err: Error, data: FfprobeData) => {
					if (err) {
						throw (err);
					}
					// TODO: Save more data (if we need) !

					info.duration = data.streams[0].duration;
					info.framerate = data.streams[0].avg_frame_rate;
					info.bitrate = data.streams[0].bit_rate;
					resolve(info);
				});
		} catch (err: unknown) {
			// Errors will result in a warning and the file will not be added to the queue.
			reject(err);
		}
	});
}
import type {VideoFile} from './Queue';
import type {FfprobeData} from 'fluent-ffmpeg';
import fluent from 'fluent-ffmpeg';
import {logger} from './logger';
import {stat} from 'fs/promises';

export const processFile = async (path: string): Promise<VideoFile> => {
	// Returns a promise so that data can be collected for the
	// api/upload process before the file is added to the queue
	if (await checkCopy(path)) {
		return new Promise<VideoFile>((resolve, reject) => {
			try {
				const info: VideoFile = {
					location: path,
					programName: path.split('/')[1].split('.')[0],
					// Program name is derived from the name of the location after the last / and before the first .
				};
				const regexp = /^[A-z,\-,_,0-9]*_F_[0-9]{8}$/;
				if (regexp.test(info.programName)) {
					// If the program name is valid contruct the date
					logger.info(`File Data: ${info.location} passed regexp`);
					const dateString = info.programName.split('_F_')[1];
					const year = dateString.slice(4, dateString.length);
					const month = dateString.slice(0, 2);
					const day = dateString.slice(2, 4);
					// Construct date using YYYY-MM-D format
					info.date = new Date(`${year}-${month}-${day}`);
					if (info.date.getFullYear() < 1980) {
						throw (new Error(`file ${info.location} returns a date with a year before 1980, rejecting`));
					} else if (info.date.getFullYear() > (new Date().getFullYear() + 1)) {
						throw (new Error(`file ${info.location} returns a date with a year before 1980, rejecting`));
					}
				} else {
					throw (new Error(`file ${info.location} does not match program name regexp, rejecting`));
				}

				// Ffprobe is used to extract video data
				fluent(info.location)
					.ffprobe((err: Error, data: FfprobeData) => {
						if (err) {
							logger.error(err.message);
							reject(new Error(`ffprobe failed to open ${info.location}`));
						} else {
							info.duration = data.streams[0].duration;
							info.framerate = data.streams[0].avg_frame_rate;
							info.bitrate = data.streams[0].bit_rate;
							resolve(info);
						}
					});
			} catch (err: unknown) {
				// Errors will result in a warning and the file will not be added to the queue.
				reject(err);
			}
		});
	}

	throw new Error('check copy process returned unexpectedly');
};

const checkCopy = async (path: string): Promise<boolean> => new Promise((resolve, reject) => {
	let prevMtime: number;
	function st() {
		stat(path)
			.then(stats => {
				if (!prevMtime) {
					prevMtime = stats.mtimeMs;
					setTimeout(st, 1000);
				} else if (stats.mtimeMs === prevMtime) {
					resolve(true);
				} else {
					prevMtime = stats.mtimeMs;
					setTimeout(st, 1000);
				}
			})
			.catch((err: Error) => {
				reject(err);
			});
	}

	st();
});

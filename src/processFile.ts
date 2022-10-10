import type {VideoFile} from './Queue';
import type {FfprobeData} from 'fluent-ffmpeg';
import fluent from 'fluent-ffmpeg';

export async function processFile(path: string): Promise<VideoFile> {
	return new Promise<VideoFile>((resolve, reject) => {
		try {
			console.log('Processing');
			const info: VideoFile = {
				location: path,
				programName: path.split('/')[1].split('.')[0],
			};
			const regexp = /^.*_F_[0-9]*$/;
			if (regexp.test(info.programName)) {
				//TODO: !!!!! Date Broken this doesn't work!!!
				const dateString = info.programName.split('_F_')[1];
				info.date = new Date(dateString);
			} else {
				throw (new Error('File does not match program name regexp'));
			}

			fluent(info.location)
				.ffprobe((err: Error, data: FfprobeData) => {
					if (err) {
						throw (err);
					}

					info.duration = data.streams[0].duration;
					info.framerate = data.streams[0].avg_frame_rate;
					info.bitrate = data.streams[0].bit_rate;
					resolve(info);
				});
		} catch (err: unknown) {
			reject(err);
		}
	});
}

import winston, {createLogger} from 'winston';
const {combine, timestamp, printf} = winston.format;

// ANCHOR: Logging

// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
const textLogFormat = printf(({level, message, timestamp}) => `${timestamp} ${level}: ${message}`);

export const logger = createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		//
		// Write all logs with importance level of `error` or less to `error.log`
		// Write all logs with importance level of `info` or less to `combined.log`
		//
		new winston.transports.File({filename: 'logs/error.log', level: 'error'}),
		new winston.transports.File({filename: `logs/${new Date().getFullYear()}-${new Date().getMonth()}-combined.log`, format: combine(
			timestamp(),
			textLogFormat,
		)}),
		// Write all logs to console
		new winston.transports.Console({format: combine(
			timestamp({format: 'YYYY-MM-DD HH:mm:ss Z'}),
			winston.format.cli(),
			textLogFormat,
		),

		}),
	],
});

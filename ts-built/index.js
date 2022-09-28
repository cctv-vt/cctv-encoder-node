"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const winston_1 = __importStar(require("winston"));
const { combine, timestamp, printf } = winston_1.default.format;
const chokidar_1 = __importDefault(require("chokidar"));
const ffmpeg_1 = __importDefault(require("ffmpeg"));
const fs_1 = require("fs");
// ANCHOR: Logging
// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
const textLogFormat = printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`);
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston_1.default.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: `logs/${new Date().getFullYear()}-${new Date().getMonth()}-combined.log`, format: combine(timestamp(), textLogFormat) }),
        new winston_1.default.transports.Console({ format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss Z' }), winston_1.default.format.cli(), textLogFormat),
        }),
    ],
});
const ffmpegLogger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        // Write all logs with importance level of `error` or less to `logs/error.log`
        // Write all logs with importance level of `info` or less to `logs/YYYY-MM-combined.log`
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: `logs/${new Date().getFullYear()}-${new Date().getMonth()}-combined.log`, format: combine(timestamp(), textLogFormat) }),
        // Write all logs to console
        new winston_1.default.transports.Console({ format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss Z' }), winston_1.default.format.cli(), textLogFormat),
        }),
    ],
});
// ANCHOR: Queue
class Queue {
    constructor(options) {
        this.q = [];
        this.file = options.file;
        if (options.file) {
            if ((0, fs_1.existsSync)(options.file)) {
                try {
                    logger.info(`Queue: trying to read ${options.file}`);
                    // TODO: implement type checking reading queue
                    this.q = JSON.parse((0, fs_1.readFileSync)(options.file).toString());
                    logger.info(`Queue: read file ${options.file}`);
                }
                catch (_a) {
                    logger.warn(`Queue: ${options.file} does not contain valid json, reseting file`);
                    (0, fs_1.writeFileSync)(this.file, JSON.stringify(this.q));
                }
            }
            else {
                (0, fs_1.writeFile)(this.file, JSON.stringify(this.q), err => {
                    if (err) {
                        logger.error(err);
                    }
                });
            }
        }
    }
    add(item) {
        this.q.push(item);
        this.updateFile();
    }
    recieve() {
        const current = this.q.shift() || '';
        this.updateFile();
        return current;
    }
    print() {
        return this.q;
    }
    updateFile() {
        if (this.file) {
            (0, fs_1.writeFileSync)(this.file, JSON.stringify(this.q));
        }
    }
}
const encodeQueue = new Queue({ file: './queue.json' });
chokidar_1.default.watch('./video-input').on('add', (path) => {
    logger.info(`Watch: ${path} has been seen in the watch folder`);
    if (/^.*\.mp4$/.test(path)) {
        console.log(encodeQueue.print().includes(path));
        if (encodeQueue.print().includes(path)) {
            logger.warn(`Watch: ${path} is already in the queue, ignoring`);
        }
        else {
            encodeQueue.add(path);
            logger.info(`Watch: ${path} has been added to the queue`);
        }
    }
    else {
        logger.warn(`Watch: ${path} is not an mp4, ignoring`);
    }
});
// ANCHOR: Encode
let emptyQueue;
const tryEncode = () => {
    const ms = 500; // Waiting period is kind of arbitrary
    if (encodeQueue.print().length) {
        emptyQueue = false;
        const currentFile = encodeQueue.recieve();
        const currentFileName = currentFile.split('/')[1];
        logger.info(`Encoder: found ${currentFile} at front of queue`);
        // eslint-disable-next-line new-cap, no-new
        new ffmpeg_1.default(currentFile, (err, video) => {
            if (err) {
                console.log('error');
                console.log(err);
                console.log(video);
                logger.error(`Error: error opening ${currentFile} with ffmpeg`);
                tryEncode();
            }
            else {
                logger.info(`Encoder: ${currentFile} opened with ffmpeg`);
                console.log(video.metadata);
                video
                    .setVideoSize('?x720')
                    .save(`video-output/${currentFileName}`, (err, file) => {
                    if (err) {
                        logger.error(err);
                        console.log(err);
                    }
                    else {
                        logger.info(`Encoder: encoded file: ${file}`);
                        (0, fs_1.unlink)(currentFile, () => {
                            logger.info(`Encoder: ${currentFile} removed`);
                        });
                        tryEncode();
                    }
                });
            }
        });
    }
    else {
        if (!emptyQueue) {
            logger.info('Encoder: nothing in queue');
            emptyQueue = true;
        }
        logger.verbose(`Encoder: nothing in queue, retrying in ${ms}ms`);
        setTimeout(() => {
            // Try encode is run again after a waiting period
            tryEncode();
        }, ms);
    }
};
tryEncode();
// ANCHOR: Upload
const gcsUpload = (file) => {
    logger.warn(`GCS Upload: Not Implemented (${file})`);
};

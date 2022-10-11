// Imports the Google Cloud client library
import {Storage} from '@google-cloud/storage';
import type {UploadOptions} from '@google-cloud/storage';
import {fstat, readdirSync} from 'fs';

// Creates a client
const storage = new Storage();

export async function uploadFile(folder: string) {
	readdirSync(folder).forEach(async val => {
		console.log(val);
		const options: UploadOptions = {
			destination: val,
		};
		// Await storage.bucket(bucketName).upload(filePath, options);
		// console.log(`${filePath} uploaded to ${bucketName}`);
	});
}

// U uploadFile().catch(console.error);

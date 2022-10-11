/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
// The ID of your GCS bucket
const bucketName = 'cctv-library';

// The path to your file to upload
const filePath = 'path/to/your/file';

// The new ID for your GCS file
const destFileName = 'your-new-file-name';

// Imports the Google Cloud client library
import {Storage} from '@google-cloud/storage';
import type {UploadOptions} from '@google-cloud/storage';
import { fstat, readdirSync } from 'fs';

// Creates a client
const storage = new Storage();

export async function uploadFile(folder: string) {
	readdirSync(folder).forEach(async val => {
		console.log(val);
		const options: UploadOptions = {
			destination: destFileName,
		};
		// await storage.bucket(bucketName).upload(filePath, options);
		// console.log(`${filePath} uploaded to ${bucketName}`);
	});
}

// U uploadFile().catch(console.error);

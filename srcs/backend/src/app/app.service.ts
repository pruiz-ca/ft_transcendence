import { Injectable } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';

@Injectable()
export class AppService {

	uploadImage(file) {
		const dir = "./assets/";
		const path = dir + file.originalname;
		if (!existsSync(dir))
			mkdirSync(dir);
		if (!existsSync(path)) {
			const stream = createWriteStream(path);
			stream.write(file.buffer);
		}
	}
}

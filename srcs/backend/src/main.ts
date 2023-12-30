import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	app.enableCors({
		allowedHeaders: "Content-Type, X-Requested-With, Accept, Origin ",
		origin: process.env.HOME_URL,
		credentials: true
	});
	await app.listen(3000);
}
bootstrap();

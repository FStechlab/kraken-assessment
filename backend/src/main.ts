import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./presentation/modules/AppModule";
import * as fs from "fs";

async function bootstrap() {
  // Ensure the data directory exists for SQLite
  fs.mkdirSync("data", { recursive: true });

  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error"],
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = parseInt(process.env.PORT ?? "3000", 10);
  await app.listen(port);
  console.log(
    `🚀 ts-coverage-improver backend running on http://localhost:${port}`,
  );
}

bootstrap();

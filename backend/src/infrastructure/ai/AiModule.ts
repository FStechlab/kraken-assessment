import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GroqTestGeneratorAdapter } from "./GroqTestGeneratorAdapter";
import { AI_TEST_GENERATOR_PORT } from "../../application/ports/IAiTestGeneratorPort";

@Module({
  imports: [ConfigModule],
  providers: [
    GroqTestGeneratorAdapter,
    { provide: AI_TEST_GENERATOR_PORT, useExisting: GroqTestGeneratorAdapter },
  ],
  exports: [AI_TEST_GENERATOR_PORT],
})
export class AiModule {}

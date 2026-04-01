import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Groq from "groq-sdk";
import {
  IAiTestGeneratorPort,
  GenerateTestsOptions,
  GeneratedTests,
} from "../../application/ports/IAiTestGeneratorPort";
import * as path from "path";

@Injectable()
export class GroqTestGeneratorAdapter implements IAiTestGeneratorPort {
  private readonly logger = new Logger(GroqTestGeneratorAdapter.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({
      apiKey: this.configService.getOrThrow<string>("GROQ_API_KEY"),
    });
    this.model = this.configService.get<string>(
      "GROQ_MODEL",
      "llama-3.3-70b-versatile",
    );
  }

  async generateTests(options: GenerateTestsOptions): Promise<GeneratedTests> {
    this.logger.log(
      `Generating tests for ${options.sourceFilePath} using Groq/${this.model}`,
    );

    const testFilePath = this.resolveTestFilePath(options.sourceFilePath);
    const prompt = this.buildPrompt(options);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `You are an expert TypeScript developer specializing in writing comprehensive Jest unit tests.
Your goal is to generate high-quality test code that improves code coverage.
Always output ONLY the TypeScript test file content — no explanations, no markdown code fences, no preamble.
Use Jest as the testing framework with standard imports.
Tests should be meaningful, covering edge cases and happy paths.
Mock external dependencies where appropriate using jest.mock().`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    });

    const testCode = response.choices[0]?.message?.content ?? "";
    const cleanedCode = this.extractCodeFromResponse(testCode);

    return { testFilePath, testCode: cleanedCode };
  }

  private resolveTestFilePath(sourceFilePath: string): string {
    const dir = path.dirname(sourceFilePath);
    const base = path.basename(sourceFilePath);
    const ext = path.extname(base);
    const nameWithoutExt = base.slice(0, -ext.length);
    return path.join(dir, `${nameWithoutExt}.test${ext}`);
  }

  private buildPrompt(options: GenerateTestsOptions): string {
    const parts: string[] = [];

    parts.push(`Repository: ${options.repositorySlug}`);
    parts.push(`Source file: ${options.sourceFilePath}`);
    parts.push("");
    parts.push("=== SOURCE CODE ===");
    parts.push(options.sourceCode);
    parts.push("");

    if (options.existingTestCode) {
      parts.push("=== EXISTING TESTS (enhance these) ===");
      parts.push(options.existingTestCode);
      parts.push("");
    }

    if (options.uncoveredLines.length > 0) {
      parts.push("=== UNCOVERED LINES (must be tested) ===");
      parts.push(`Lines: ${options.uncoveredLines.slice(0, 50).join(", ")}`);
      if (options.uncoveredLines.length > 50) {
        parts.push(`... and ${options.uncoveredLines.length - 50} more`);
      }
      parts.push("");
    }

    if (options.uncoveredFunctions.length > 0) {
      parts.push("=== UNCOVERED FUNCTIONS (must be tested) ===");
      parts.push(options.uncoveredFunctions.join(", "));
      parts.push("");
    }

    parts.push("=== TASK ===");
    if (options.existingTestCode) {
      parts.push(
        "Enhance the existing test file to cover the uncovered lines and functions listed above.",
      );
    } else {
      parts.push(
        "Generate a comprehensive Jest test file for the source code above, covering ALL exported functions and classes.",
      );
    }
    parts.push(
      "The test file must achieve at least 80% line coverage.",
      "Output ONLY the complete TypeScript test file content, with no extra explanation.",
    );

    return parts.join("\n");
  }

  private extractCodeFromResponse(response: string): string {
    // Strip markdown code fences if the model included them
    const fenceRegex = /^```(?:typescript|ts)?\n([\s\S]*?)\n```$/m;
    const match = fenceRegex.exec(response.trim());
    return match ? match[1] : response.trim();
  }
}

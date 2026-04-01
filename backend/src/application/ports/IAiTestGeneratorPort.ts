export interface GenerateTestsOptions {
  sourceFilePath: string;
  sourceCode: string;
  existingTestCode: string | null;
  uncoveredLines: number[];
  uncoveredFunctions: string[];
  repositorySlug: string;
}

export interface GeneratedTests {
  testFilePath: string;
  testCode: string;
}

export interface IAiTestGeneratorPort {
  generateTests(options: GenerateTestsOptions): Promise<GeneratedTests>;
}

export const AI_TEST_GENERATOR_PORT = Symbol("IAiTestGeneratorPort");

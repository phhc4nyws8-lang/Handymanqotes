import { ImageGenerator } from "./types";
import { MockImageGenerator } from "./mock";

export type { ImageGenerationRequest, ImageGenerationResult, ImageGenerator } from "./types";
export { buildAfterPhotoPrompt } from "./prompt";
export { MockImageGenerator } from "./mock";

let cached: ImageGenerator | null = null;

/**
 * Picks the real image generator once the app is out of demo mode:
 * `AI_IMAGE_PROVIDER` ("gemini" | "openai") selects explicitly when set;
 * otherwise whichever key is present wins (OpenAI first if both are set).
 * Falls back to the mock in demo mode or when no matching key is configured.
 * Cached per process since no implementation holds per-request state. Each
 * provider's SDK is dynamically imported so neither is loaded while running
 * in demo mode or unused.
 */
export async function getImageGenerator(): Promise<ImageGenerator> {
  if (cached) return cached;

  const demoMode = process.env.DEMO_MODE !== "false";
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const explicitProvider = process.env.AI_IMAGE_PROVIDER?.toLowerCase();

  const provider = explicitProvider || (openaiKey ? "openai" : geminiKey ? "gemini" : null);

  if (!demoMode && provider === "openai" && openaiKey) {
    const { OpenAIImageGenerator } = await import("./openai");
    cached = new OpenAIImageGenerator(openaiKey);
  } else if (!demoMode && provider === "gemini" && geminiKey) {
    const { GeminiImageGenerator } = await import("./gemini");
    cached = new GeminiImageGenerator(geminiKey);
  } else {
    cached = new MockImageGenerator();
  }

  return cached;
}

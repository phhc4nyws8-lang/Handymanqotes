import { ImageGenerator } from "./types";
import { MockImageGenerator } from "./mock";

export type { ImageGenerationRequest, ImageGenerationResult, ImageGenerator } from "./types";
export { buildAfterPhotoPrompt } from "./prompt";
export { MockImageGenerator } from "./mock";

let cached: ImageGenerator | null = null;

/**
 * Picks the real Gemini implementation when the app is out of demo mode and
 * a key is configured; falls back to the mock otherwise. Cached per process
 * since neither implementation holds per-request state. The Gemini SDK is
 * dynamically imported so it's never loaded (or required to be installed
 * correctly) while running in demo mode.
 */
export async function getImageGenerator(): Promise<ImageGenerator> {
  if (cached) return cached;

  const demoMode = process.env.DEMO_MODE !== "false";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!demoMode && apiKey) {
    const { GeminiImageGenerator } = await import("./gemini");
    cached = new GeminiImageGenerator(apiKey);
  } else {
    cached = new MockImageGenerator();
  }

  return cached;
}

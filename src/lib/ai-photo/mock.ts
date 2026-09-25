import { ImageGenerationRequest, ImageGenerationResult, ImageGenerator } from "./types";

/**
 * Demo-mode stand-in: does NOT call any AI service and does NOT generate a
 * real "after" image. It passes the before photo straight through, tagged
 * `isDemo: true` so calling code and the UI can render an unmistakable
 * "demo preview — not a real AI render" badge instead of presenting a fake
 * photo as if it were real. This lets the whole quote flow (upload, select
 * materials, preview, email) be exercised end-to-end with zero cost and no
 * API key, before GEMINI_API_KEY is added and DEMO_MODE is turned off.
 */
export class MockImageGenerator implements ImageGenerator {
  async generateAfterPhoto(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    return {
      imageBuffer: request.beforeImage,
      mimeType: request.beforeImageMimeType,
      provider: "mock",
      isDemo: true,
    };
  }
}

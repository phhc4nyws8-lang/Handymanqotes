import OpenAI, { toFile } from "openai";
import { ImageGenerationRequest, ImageGenerationResult, ImageGenerator } from "./types";

const MODEL = "gpt-image-1";

/**
 * Real "after" photo generation via OpenAI's gpt-image-1 image-editing
 * endpoint. Like the Gemini implementation, this edits the uploaded before
 * photo in place rather than generating an unrelated image — the prompt
 * (see prompt.ts) is the same one used for Gemini, instructing the model to
 * preserve the room's real geometry and only change the finishes.
 */
export class OpenAIImageGenerator implements ImageGenerator {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateAfterPhoto(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const inputFile = await toFile(request.beforeImage, "before.png", { type: request.beforeImageMimeType });

    const response = await this.client.images.edit({
      model: MODEL,
      image: inputFile,
      prompt: request.prompt,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI did not return an image. The prompt or photo may have been rejected by its safety filters.");
    }

    return {
      imageBuffer: Buffer.from(b64, "base64"),
      mimeType: "image/png",
      provider: "openai",
      isDemo: false,
    };
  }
}

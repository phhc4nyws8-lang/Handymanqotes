import { GoogleGenAI } from "@google/genai";
import { ImageGenerationRequest, ImageGenerationResult, ImageGenerator } from "./types";

const MODEL = "gemini-2.5-flash-image";

/**
 * Real "after" photo generation via Google's Gemini image-editing model
 * ("nano banana"). It takes the uploaded before-photo as inline image data
 * plus the constructed prompt (see prompt.ts) and edits it in place, which
 * is what keeps the output looking like the customer's actual room instead
 * of a generic AI-generated space.
 */
export class GeminiImageGenerator implements ImageGenerator {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateAfterPhoto(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const response = await this.client.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: request.prompt },
            {
              inlineData: {
                mimeType: request.beforeImageMimeType,
                data: request.beforeImage.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      const finishReason = response.candidates?.[0]?.finishReason ?? "unknown reason";
      throw new Error(`Gemini did not return an image (${finishReason}). The prompt or photo may have been rejected by the model's safety filters.`);
    }

    return {
      imageBuffer: Buffer.from(imagePart.inlineData.data, "base64"),
      mimeType: imagePart.inlineData.mimeType ?? "image/png",
      provider: "gemini",
      isDemo: false,
    };
  }
}

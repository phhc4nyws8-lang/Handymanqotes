export interface ImageGenerationRequest {
  beforeImage: Buffer;
  beforeImageMimeType: string;
  prompt: string;
}

export interface ImageGenerationResult {
  imageBuffer: Buffer;
  mimeType: string;
  provider: string;
  /** True for the mock/demo provider — the UI must make this obvious to the contractor. */
  isDemo: boolean;
}

/**
 * Generates a photorealistic "after" render by editing an uploaded "before"
 * photo in place (not generating a fresh, unrelated image) — that's what
 * keeps the result looking like the customer's actual space instead of a
 * generic stock render. Swappable so a different provider can replace
 * Gemini without touching any calling code.
 */
export interface ImageGenerator {
  generateAfterPhoto(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

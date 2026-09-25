/**
 * Builds the instruction sent to the image-editing model. The framing here
 * is deliberate: this must read as "edit this exact photo," never "generate
 * a new photo of a room like this" — that distinction is what keeps the
 * result looking like the customer's actual space (real camera angle, real
 * window/door placement, real lighting) instead of a generic AI render.
 */
export function buildAfterPhotoPrompt(params: {
  spaceName: string;
  projectDescription: string;
  materialDescriptors: string[];
}): string {
  const { spaceName, projectDescription, materialDescriptors } = params;

  const lines = [
    `Edit this exact photograph of a ${spaceName.toLowerCase()} to show what it will look like after a ${projectDescription}.`,
    ``,
    `Critical constraints — do not violate these:`,
    `- Keep the exact same camera angle, framing, and perspective as the original photo.`,
    `- Keep the room's real architecture unchanged: wall positions, window and door locations/sizes, ceiling height, and overall layout must match the original exactly.`,
    `- Keep any structural or plumbing elements not explicitly replaced below (e.g. window trim, door casings, outlet/switch locations) exactly where they are in the original.`,
    `- Match the lighting direction and quality of the original photo — do not relight the scene artificially.`,
    ``,
    `Apply these finish/fixture changes realistically, to the correct surfaces:`,
    ...materialDescriptors.map((d) => `- ${d}`),
    ``,
    `The result must look like a real photograph of the same physical room after the work was done — not a digital rendering, not a staged stock photo, not a different room. Keep it photorealistic, with authentic material textures, grout lines, seams, and imperfections consistent with real construction.`,
  ];

  return lines.join("\n");
}

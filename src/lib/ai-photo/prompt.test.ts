import { describe, expect, it } from "vitest";
import { buildAfterPhotoPrompt } from "./prompt";

describe("buildAfterPhotoPrompt", () => {
  it("instructs the model to edit the exact photo rather than generate a new one", () => {
    const prompt = buildAfterPhotoPrompt({
      spaceName: "Main Bathroom",
      projectDescription: "bathroom remodel",
      materialDescriptors: ["matte porcelain wood-look tile flooring, warm walnut tone"],
    });

    expect(prompt).toContain("Edit this exact photograph");
    expect(prompt).toContain("same camera angle");
    expect(prompt).toContain("matte porcelain wood-look tile flooring, warm walnut tone");
    expect(prompt).toContain("not a digital rendering");
  });

  it("includes every material descriptor passed in", () => {
    const prompt = buildAfterPhotoPrompt({
      spaceName: "Kitchen",
      projectDescription: "kitchen remodel",
      materialDescriptors: ["white shaker cabinets", "quartz countertop", "subway tile backsplash"],
    });

    expect(prompt).toContain("white shaker cabinets");
    expect(prompt).toContain("quartz countertop");
    expect(prompt).toContain("subway tile backsplash");
  });
});

import { describe, expect, it } from "vitest";
import { profilePhotoSourceProblem } from "./profile-photo";

describe("profile photo source", () => {
  it("lets a large phone photo open in the crop", () => {
    expect(profilePhotoSourceProblem({ type: "image/jpeg", size: 12 * 1024 * 1024 })).toBeNull();
    expect(profilePhotoSourceProblem({ type: "", size: 8 * 1024 * 1024 })).toBeNull();
  });

  it("rejects a file that is not an image or is over 25 MB", () => {
    expect(profilePhotoSourceProblem({ type: "application/pdf", size: 1000 })).toBe("Please choose an image");
    expect(profilePhotoSourceProblem({ type: "image/jpeg", size: 26 * 1024 * 1024 })).toMatch(/25 MB/);
  });
});

import { describe, expect, it } from "vitest";
import { profilePhotoPassThrough, profilePhotoSourceProblem } from "./profile-photo";

describe("profile photo source", () => {
  it("lets a large phone photo be chosen", () => {
    expect(profilePhotoSourceProblem({ type: "image/jpeg", size: 12 * 1024 * 1024 })).toBeNull();
    expect(profilePhotoSourceProblem({ type: "", size: 8 * 1024 * 1024 })).toBeNull();
  });

  it("rejects a file that is not an image or is over 25 MB", () => {
    expect(profilePhotoSourceProblem({ type: "application/pdf", size: 1000 })).toBe("Please choose an image");
    expect(profilePhotoSourceProblem({ type: "image/jpeg", size: 26 * 1024 * 1024 })).toMatch(/25 MB/);
  });

  it("stores a small photo as it is and marks a large one to be made smaller", () => {
    expect(profilePhotoPassThrough({ type: "image/png", size: 1024 })).toEqual({ contentType: "image/png", ext: "png" });
    expect(profilePhotoPassThrough({ type: "image/jpeg", size: 1024 })).toEqual({ contentType: "image/jpeg", ext: "jpg" });
    expect(profilePhotoPassThrough({ type: "", size: 1024 })).toEqual({ contentType: "image/jpeg", ext: "jpg" });
    expect(profilePhotoPassThrough({ type: "image/jpeg", size: 8 * 1024 * 1024 })).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  ANDROID_NATIVE_PROFILE,
  FLUTTER_PROFILE,
  getPlatformProfile,
  getStyleProfile,
  MINIMAL_STYLE_PROFILE,
  PLATFORM_PROFILES,
  STYLE_PROFILES_REGISTRY,
  WEB_PROFILE,
} from "./index";

describe("web profile", () => {
  it("declares page root semantic and device types", () => {
    expect(WEB_PROFILE.id).toBe("web");
    expect(WEB_PROFILE.rootSemantic).toBe("page");
    expect(WEB_PROFILE.deviceTypes).toHaveLength(5);
    expect(WEB_PROFILE.semantics.navbar?.displayName).toBe("Navigation Bar");
    expect(WEB_PROFILE.semantics.button?.properties).toBeDefined();
    expect(WEB_PROFILE.semantics.button?.properties?.[0]?.id).toBe("variant");
  });
});

describe("android native profile", () => {
  it("declares screen root semantic and Material 3 vocabulary", () => {
    expect(ANDROID_NATIVE_PROFILE.id).toBe("androidNative");
    expect(ANDROID_NATIVE_PROFILE.rootSemantic).toBe("screen");
    expect(ANDROID_NATIVE_PROFILE.semantics["top-app-bar"]?.displayName).toBe("Top App Bar");
    expect(ANDROID_NATIVE_PROFILE.semantics["floating-action-button"]).toBeDefined();
    expect(ANDROID_NATIVE_PROFILE.semantics.navbar).toBeUndefined();
  });
});

describe("profile registry lookup", () => {
  it("returns platform profiles by platform id", () => {
    expect(getPlatformProfile("web")).toBe(WEB_PROFILE);
    expect(getPlatformProfile("androidNative")).toBe(ANDROID_NATIVE_PROFILE);
    expect(getPlatformProfile("flutter")).toBe(FLUTTER_PROFILE);
    expect(PLATFORM_PROFILES.web).toBe(WEB_PROFILE);
  });

  it("returns style profile by style id", () => {
    expect(getStyleProfile("minimal")).toBe(MINIMAL_STYLE_PROFILE);
    expect(STYLE_PROFILES_REGISTRY.minimal).toBe(MINIMAL_STYLE_PROFILE);
  });
});

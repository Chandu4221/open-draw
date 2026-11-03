import { describe, expect, it } from "vitest";
import {
  ANDROID_NATIVE_PROFILE,
  CRAYON_STYLE_PROFILE,
  FLUTTER_PROFILE,
  IOS_PROFILE,
  getPlatformProfile,
  getStyleProfile,
  MINIMAL_STYLE_PROFILE,
  PLATFORM_PROFILES,
  STYLE_PROFILES_REGISTRY,
  WEB_PROFILE,
} from "./index";

describe("web profile", () => {
  it("declares page root semantic and device types without exposing page to child semantics", () => {
    expect(WEB_PROFILE.id).toBe("web");
    expect(WEB_PROFILE.rootSemantic).toBe("page");
    expect(WEB_PROFILE.semantics.page).toBeUndefined();
    expect(WEB_PROFILE.deviceTypes).toHaveLength(5);
    expect(WEB_PROFILE.semantics.navbar?.displayName).toBe("Navigation Bar");
    expect(WEB_PROFILE.semantics.button?.properties).toBeDefined();
    expect(WEB_PROFILE.semantics.button?.properties?.[0]?.id).toBe("variant");
  });

  it("exposes extended common web semantics", () => {
    expect(WEB_PROFILE.semantics.image?.displayName).toBe("Image");
    expect(WEB_PROFILE.semantics.dialog?.displayName).toBe("Modal Dialog");
    expect(WEB_PROFILE.semantics.dropdown?.displayName).toBe("Dropdown Menu");
    expect(WEB_PROFILE.semantics.checkbox?.displayName).toBe("Checkbox");
    expect(WEB_PROFILE.semantics.badge?.displayName).toBe("Badge");
    expect(WEB_PROFILE.semantics.tabs?.displayName).toBe("Tabs");
    expect(WEB_PROFILE.semantics.avatar?.displayName).toBe("Avatar");
    expect(WEB_PROFILE.semantics.link?.displayName).toBe("Link");
  });
});

describe("android native profile", () => {
  it("declares screen root semantic and Material 3 vocabulary without exposing screen to child semantics", () => {
    expect(ANDROID_NATIVE_PROFILE.id).toBe("androidNative");
    expect(ANDROID_NATIVE_PROFILE.rootSemantic).toBe("screen");
    expect(ANDROID_NATIVE_PROFILE.semantics.screen).toBeUndefined();
    expect(ANDROID_NATIVE_PROFILE.semantics["top-app-bar"]?.displayName).toBe("Top App Bar");
    expect(ANDROID_NATIVE_PROFILE.semantics["floating-action-button"]).toBeDefined();
    expect(ANDROID_NATIVE_PROFILE.semantics.navbar).toBeUndefined();
  });

  it("exposes extended Material 3 components", () => {
    expect(ANDROID_NATIVE_PROFILE.semantics.dialog?.displayName).toBe("Material Dialog");
    expect(ANDROID_NATIVE_PROFILE.semantics["bottom-sheet"]?.displayName).toBe("Bottom Sheet");
    expect(ANDROID_NATIVE_PROFILE.semantics["text-field"]?.displayName).toBe("Outlined Text Field");
    expect(ANDROID_NATIVE_PROFILE.semantics.switch?.displayName).toBe("Switch Toggle");
    expect(ANDROID_NATIVE_PROFILE.semantics.checkbox?.displayName).toBe("Material Checkbox");
    expect(ANDROID_NATIVE_PROFILE.semantics.chip?.displayName).toBe("Assist / Filter Chip");
    expect(ANDROID_NATIVE_PROFILE.semantics["tab-row"]?.displayName).toBe("Primary Tab Row");
    expect(ANDROID_NATIVE_PROFILE.semantics.badge?.displayName).toBe("Badge Indicator");
  });
});

describe("flutter profile", () => {
  it("declares scaffold root semantic without exposing scaffold to child semantics", () => {
    expect(FLUTTER_PROFILE.id).toBe("flutter");
    expect(FLUTTER_PROFILE.rootSemantic).toBe("scaffold");
    expect(FLUTTER_PROFILE.semantics.scaffold).toBeUndefined();
    expect(FLUTTER_PROFILE.semantics["app-bar"]?.displayName).toBe("AppBar");
  });

  it("exposes standard Flutter widget semantics", () => {
    expect(FLUTTER_PROFILE.semantics["text-field"]?.displayName).toBe("TextField");
    expect(FLUTTER_PROFILE.semantics.card?.displayName).toBe("Card");
    expect(FLUTTER_PROFILE.semantics["floating-action-button"]?.displayName).toBe(
      "FloatingActionButton",
    );
    expect(FLUTTER_PROFILE.semantics["bottom-navigation-bar"]?.displayName).toBe(
      "BottomNavigationBar",
    );
    expect(FLUTTER_PROFILE.semantics.dialog?.displayName).toBe("AlertDialog");
    expect(FLUTTER_PROFILE.semantics.checkbox?.displayName).toBe("Checkbox");
    expect(FLUTTER_PROFILE.semantics.switch?.displayName).toBe("Switch");
    expect(FLUTTER_PROFILE.semantics["list-tile"]?.displayName).toBe("ListTile");
  });
});

describe("ios profile", () => {
  it("declares screen root semantic and Apple HIG semantics", () => {
    expect(IOS_PROFILE.id).toBe("ios");
    expect(IOS_PROFILE.rootSemantic).toBe("screen");
    expect(IOS_PROFILE.semantics.screen).toBeUndefined();
    expect(IOS_PROFILE.semantics["navigation-bar"]?.displayName).toBe("Navigation Bar");
    expect(IOS_PROFILE.semantics["tab-bar"]?.displayName).toBe("Tab Bar");
    expect(IOS_PROFILE.semantics.button?.displayName).toBe("Button");
    expect(IOS_PROFILE.semantics["text-field"]?.displayName).toBe("Text Field");
    expect(IOS_PROFILE.semantics["segmented-control"]?.displayName).toBe("Segmented Control");
    expect(IOS_PROFILE.semantics.switch?.displayName).toBe("Toggle Switch");
    expect(IOS_PROFILE.semantics.slider?.displayName).toBe("Slider");
    expect(IOS_PROFILE.semantics.card?.displayName).toBe("Grouped Inset Card");
    expect(IOS_PROFILE.semantics.alert?.displayName).toBe("Alert Dialog");
  });
});

describe("profile registry lookup", () => {
  it("returns platform profiles by platform id", () => {
    expect(getPlatformProfile("web")).toBe(WEB_PROFILE);
    expect(getPlatformProfile("androidNative")).toBe(ANDROID_NATIVE_PROFILE);
    expect(getPlatformProfile("flutter")).toBe(FLUTTER_PROFILE);
    expect(getPlatformProfile("ios")).toBe(IOS_PROFILE);
    expect(PLATFORM_PROFILES.web).toBe(WEB_PROFILE);
    expect(PLATFORM_PROFILES.ios).toBe(IOS_PROFILE);
  });

  it("returns style profile by style id", () => {
    expect(getStyleProfile("minimal")).toBe(MINIMAL_STYLE_PROFILE);
    expect(getStyleProfile("crayon")).toBe(CRAYON_STYLE_PROFILE);
    expect(STYLE_PROFILES_REGISTRY.minimal).toBe(MINIMAL_STYLE_PROFILE);
    expect(STYLE_PROFILES_REGISTRY.crayon).toBe(CRAYON_STYLE_PROFILE);
  });
});

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
    expect(WEB_PROFILE.semantics.navbar?.properties?.some((p) => p.id === "position")).toBe(true);
    expect(WEB_PROFILE.semantics.heading?.properties?.[0]?.options).toHaveLength(6);
    expect(WEB_PROFILE.semantics.button?.properties).toBeDefined();
    expect(WEB_PROFILE.semantics.button?.properties?.[0]?.id).toBe("variant");
  });

  it("exposes extended common web semantics", () => {
    expect(WEB_PROFILE.semantics.form?.displayName).toBe("Form Container");
    expect(WEB_PROFILE.semantics.modal?.displayName).toBe("Modal Window");
    expect(WEB_PROFILE.semantics.image?.displayName).toBe("Image");
    expect(WEB_PROFILE.semantics.dropdown?.displayName).toBe("Dropdown Menu");
    expect(WEB_PROFILE.semantics.checkbox?.displayName).toBe("Checkbox");
    expect(WEB_PROFILE.semantics.badge?.displayName).toBe("Badge");
    expect(WEB_PROFILE.semantics.tabs?.displayName).toBe("Tabs");
    expect(WEB_PROFILE.semantics.avatar?.displayName).toBe("Avatar");
    expect(WEB_PROFILE.semantics.link?.displayName).toBe("Link");
  });

  it("organizes streamlined semantic components across active categories", () => {
    const semantics = Object.values(WEB_PROFILE.semantics);
    expect(semantics).toHaveLength(53);

    // Verify presence and categorization of key components across categories
    expect(WEB_PROFILE.semantics.header?.category).toBe("layout");
    expect(WEB_PROFILE.semantics.section?.scope).toBe("section");

    expect(WEB_PROFILE.semantics.navbar?.category).toBe("navigation");
    expect(WEB_PROFILE.semantics.navbar?.scope).toBe("section");

    expect(WEB_PROFILE.semantics.button?.category).toBe("interactive");
    expect(WEB_PROFILE.semantics.button?.scope).toBe("component");

    expect(WEB_PROFILE.semantics["search-bar"]?.category).toBe("forms");
    expect(WEB_PROFILE.semantics["search-bar"]?.scope).toBe("component");

    expect(WEB_PROFILE.semantics.table?.category).toBe("data");

    expect(WEB_PROFILE.semantics.heading?.category).toBe("content");
    expect(WEB_PROFILE.semantics.text?.category).toBe("content");
    expect(WEB_PROFILE.semantics.icon?.category).toBe("content");
    expect(WEB_PROFILE.semantics.accordion?.category).toBe("content");
    expect(WEB_PROFILE.semantics.article?.scope).toBe("section");

    expect(WEB_PROFILE.semantics.toast?.category).toBe("feedback");
    expect(WEB_PROFILE.semantics.toast?.scope).toBe("component");
    expect(WEB_PROFILE.semantics.drawer?.scope).toBe("component");
  });
});

describe("android native profile", () => {
  it("declares screen root semantic and Material 3 vocabulary without exposing screen to child semantics", () => {
    expect(ANDROID_NATIVE_PROFILE.id).toBe("androidNative");
    expect(ANDROID_NATIVE_PROFILE.rootSemantic).toBe("screen");
    expect(ANDROID_NATIVE_PROFILE.semantics.screen).toBeUndefined();
    expect(ANDROID_NATIVE_PROFILE.semantics["top-app-bar"]?.displayName).toBe("Top App Bar");
    expect(
      ANDROID_NATIVE_PROFILE.semantics["top-app-bar"]?.properties?.some((p) => p.id === "type"),
    ).toBe(true);
    expect(ANDROID_NATIVE_PROFILE.semantics["floating-action-button"]).toBeDefined();
    expect(ANDROID_NATIVE_PROFILE.semantics.navbar).toBeUndefined();
  });

  it("exposes extended Material 3 components", () => {
    expect(ANDROID_NATIVE_PROFILE.semantics.card?.properties?.some((p) => p.id === "variant")).toBe(
      true,
    );
    expect(ANDROID_NATIVE_PROFILE.semantics.dialog?.displayName).toBe("Material Dialog");
    expect(ANDROID_NATIVE_PROFILE.semantics["bottom-sheet"]?.displayName).toBe("Bottom Sheet");
    expect(ANDROID_NATIVE_PROFILE.semantics["text-field"]?.displayName).toBe("Outlined Text Field");
    expect(ANDROID_NATIVE_PROFILE.semantics.switch?.displayName).toBe("Switch Toggle");
    expect(ANDROID_NATIVE_PROFILE.semantics.checkbox?.displayName).toBe("Material Checkbox");
    expect(ANDROID_NATIVE_PROFILE.semantics.chip?.displayName).toBe("Assist / Filter Chip");
    expect(ANDROID_NATIVE_PROFILE.semantics["tab-row"]?.displayName).toBe("Primary Tab Row");
    expect(ANDROID_NATIVE_PROFILE.semantics.badge?.displayName).toBe("Badge Indicator");
  });

  it("organizes Material 3 semantics with category and scope across all 6 active categories", () => {
    const semantics = Object.values(ANDROID_NATIVE_PROFILE.semantics);
    expect(semantics.length).toBeGreaterThanOrEqual(30);

    for (const def of semantics) {
      expect(def.category).toBeDefined();
      expect(def.scope).toBeDefined();
    }

    // Verify key components in each category
    // Content
    expect(ANDROID_NATIVE_PROFILE.semantics.heading?.category).toBe("content");
    expect(ANDROID_NATIVE_PROFILE.semantics.text?.category).toBe("content");
    expect(ANDROID_NATIVE_PROFILE.semantics.image?.category).toBe("content");
    expect(ANDROID_NATIVE_PROFILE.semantics.icon?.category).toBe("content");
    expect(ANDROID_NATIVE_PROFILE.semantics.avatar?.category).toBe("content");

    // Layout
    expect(ANDROID_NATIVE_PROFILE.semantics["list-item"]?.category).toBe("layout");
    expect(ANDROID_NATIVE_PROFILE.semantics["list-item"]?.scope).toBe("component");
    expect(ANDROID_NATIVE_PROFILE.semantics.divider?.category).toBe("layout");
    expect(ANDROID_NATIVE_PROFILE.semantics.carousel?.category).toBe("layout");

    // Navigation
    expect(ANDROID_NATIVE_PROFILE.semantics["bottom-app-bar"]?.category).toBe("navigation");
    expect(ANDROID_NATIVE_PROFILE.semantics["bottom-app-bar"]?.scope).toBe("section");
    expect(ANDROID_NATIVE_PROFILE.semantics["navigation-rail"]?.category).toBe("navigation");
    expect(ANDROID_NATIVE_PROFILE.semantics["navigation-rail"]?.scope).toBe("section");
    expect(ANDROID_NATIVE_PROFILE.semantics["navigation-drawer"]?.category).toBe("navigation");
    expect(ANDROID_NATIVE_PROFILE.semantics["search-bar"]?.category).toBe("navigation");

    // Interactive
    expect(ANDROID_NATIVE_PROFILE.semantics["icon-button"]?.category).toBe("interactive");
    expect(ANDROID_NATIVE_PROFILE.semantics["icon-button"]?.scope).toBe("component");
    expect(ANDROID_NATIVE_PROFILE.semantics["segmented-button"]?.category).toBe("interactive");
    expect(
      ANDROID_NATIVE_PROFILE.semantics["floating-action-button"]?.properties?.some(
        (p) => p.id === "label",
      ),
    ).toBe(true);
    expect(ANDROID_NATIVE_PROFILE.semantics["extended-fab"]).toBeUndefined();

    // Forms
    expect(ANDROID_NATIVE_PROFILE.semantics["radio-button"]?.category).toBe("forms");
    expect(ANDROID_NATIVE_PROFILE.semantics.slider?.category).toBe("forms");
    expect(ANDROID_NATIVE_PROFILE.semantics.menu?.category).toBe("forms");
    expect(ANDROID_NATIVE_PROFILE.semantics["date-picker"]?.category).toBe("forms");
    expect(ANDROID_NATIVE_PROFILE.semantics["time-picker"]?.category).toBe("forms");

    // Feedback
    expect(ANDROID_NATIVE_PROFILE.semantics.snackbar?.category).toBe("feedback");
    expect(ANDROID_NATIVE_PROFILE.semantics.snackbar?.scope).toBe("component");
    expect(ANDROID_NATIVE_PROFILE.semantics["progress-indicator"]?.category).toBe("feedback");
    expect(ANDROID_NATIVE_PROFILE.semantics.tooltip?.category).toBe("feedback");
  });
});

describe("flutter profile", () => {
  it("declares scaffold root semantic without exposing scaffold to child semantics", () => {
    expect(FLUTTER_PROFILE.id).toBe("flutter");
    expect(FLUTTER_PROFILE.rootSemantic).toBe("scaffold");
    expect(FLUTTER_PROFILE.semantics.scaffold).toBeUndefined();
    expect(FLUTTER_PROFILE.semantics["app-bar"]?.displayName).toBe("AppBar");
    expect(
      FLUTTER_PROFILE.semantics["app-bar"]?.properties?.some((p) => p.id === "centerTitle"),
    ).toBe(true);
  });

  it("exposes standard Flutter widget semantics with category and scope", () => {
    expect(FLUTTER_PROFILE.semantics.button?.displayName).toBe("Button");
    expect(FLUTTER_PROFILE.semantics.button?.category).toBe("interactive");
    expect(FLUTTER_PROFILE.semantics.button?.scope).toBe("component");
    expect(FLUTTER_PROFILE.semantics.heading?.displayName).toBe("Heading");
    expect(FLUTTER_PROFILE.semantics.heading?.category).toBe("content");
    expect(FLUTTER_PROFILE.semantics.text?.displayName).toBe("Text");
    expect(FLUTTER_PROFILE.semantics.image?.displayName).toBe("Image");
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

    for (const def of Object.values(FLUTTER_PROFILE.semantics)) {
      expect(def.category).toBeDefined();
      expect(def.scope).toBeDefined();
    }
  });
});

describe("ios profile", () => {
  it("declares screen root semantic and Apple HIG semantics with category and scope", () => {
    expect(IOS_PROFILE.id).toBe("ios");
    expect(IOS_PROFILE.rootSemantic).toBe("screen");
    expect(IOS_PROFILE.semantics.screen).toBeUndefined();
    expect(IOS_PROFILE.semantics["navigation-bar"]?.displayName).toBe("Navigation Bar");
    expect(
      IOS_PROFILE.semantics["navigation-bar"]?.properties?.some(
        (p) => p.id === "prefersLargeTitles",
      ),
    ).toBe(true);
    expect(IOS_PROFILE.semantics["tab-bar"]?.displayName).toBe("Tab Bar");
    expect(IOS_PROFILE.semantics["tab-bar"]?.properties?.some((p) => p.id === "translucent")).toBe(
      true,
    );
    expect(IOS_PROFILE.semantics.button?.displayName).toBe("Button");
    expect(IOS_PROFILE.semantics.heading?.displayName).toBe("Heading");
    expect(IOS_PROFILE.semantics.heading?.category).toBe("content");
    expect(IOS_PROFILE.semantics.text?.displayName).toBe("Text");
    expect(IOS_PROFILE.semantics.image?.displayName).toBe("Image");
    expect(IOS_PROFILE.semantics["text-field"]?.displayName).toBe("Text Field");
    expect(IOS_PROFILE.semantics["segmented-control"]?.displayName).toBe("Segmented Control");
    expect(IOS_PROFILE.semantics.switch?.displayName).toBe("Toggle Switch");
    expect(IOS_PROFILE.semantics.slider?.displayName).toBe("Slider");
    expect(IOS_PROFILE.semantics.card?.displayName).toBe("Grouped Inset Card");
    expect(IOS_PROFILE.semantics.alert?.displayName).toBe("Alert Dialog");

    for (const def of Object.values(IOS_PROFILE.semantics)) {
      expect(def.category).toBeDefined();
      expect(def.scope).toBeDefined();
    }
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

  it("resolves android profile by both PlatformId and serialized value", () => {
    expect(getPlatformProfile("android-native")).toBe(ANDROID_NATIVE_PROFILE);
    expect(PLATFORM_PROFILES["android-native" as keyof typeof PLATFORM_PROFILES]).toBe(
      ANDROID_NATIVE_PROFILE,
    );
  });

  it("returns style profile by style id", () => {
    expect(getStyleProfile("minimal")).toBe(MINIMAL_STYLE_PROFILE);
    expect(getStyleProfile("crayon")).toBe(CRAYON_STYLE_PROFILE);
    expect(STYLE_PROFILES_REGISTRY.minimal).toBe(MINIMAL_STYLE_PROFILE);
    expect(STYLE_PROFILES_REGISTRY.crayon).toBe(CRAYON_STYLE_PROFILE);
  });
});

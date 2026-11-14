import { describe, expect, it } from "vitest";
import {
  createDocument,
  createLine,
  createRect,
  createText,
  parseShapeId,
  ROOT_ID,
} from "@open-draw/canvas";
import { PLUGIN_ROOT_PLATFORM, PLUGIN_SEMANTICS } from "@open-draw/semantics";
import { normalizeStudioDocument } from "./normalize-document";

describe("normalizeStudioDocument", () => {
  it("marks root rectangle with active platform as isContainer: true", () => {
    const rootRect = createRect(
      parseShapeId("root-screen"),
      { x: 0, y: 0, width: 400, height: 300 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "web" },
        },
      },
    );
    const doc = createDocument([rootRect]);
    expect(doc.shapes[rootRect.id]?.meta.isContainer).toBeUndefined();

    const normalized = normalizeStudioDocument(doc);
    expect(normalized).not.toBe(doc);
    expect(normalized.shapes[rootRect.id]?.meta.isContainer).toBe(true);
  });

  it("marks root rectangle as container, but ignores nested shapes when platform is NONE / Agnostic", () => {
    const plainRoot = createRect(
      parseShapeId("plain-root"),
      { x: 0, y: 0, width: 400, height: 300 },
      { parentId: ROOT_ID },
    );
    const nestedRect = createRect(
      parseShapeId("nested-rect"),
      { x: 20, y: 20, width: 100, height: 80 },
      { parentId: plainRoot.id },
    );
    const doc = createDocument([plainRoot, nestedRect]);
    const normalized = normalizeStudioDocument(doc);

    // Root is a container, but in Platform Agnostic mode, nested shapes do not act as containers
    expect(normalized.shapes[plainRoot.id]?.meta.isContainer).toBe(true);
    expect(normalized.shapes[nestedRect.id]?.meta.isContainer).toBeUndefined();
  });

  it("marks nested containers (Hero Section, Card, unclassified rect) at depth >= 2 in active platforms", () => {
    const rootWeb = createRect(
      parseShapeId("root-web"),
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "web" },
        },
      },
    );
    const heroSection = createRect(
      parseShapeId("hero-section"),
      { x: 20, y: 80, width: 1400, height: 400 },
      {
        parentId: rootWeb.id,
        meta: {
          order: {},
          pluginData: {
            [PLUGIN_SEMANTICS]: { platform: "web", id: "section" },
          },
        },
      },
    );
    const nestedCard = createRect(
      parseShapeId("feature-card"),
      { x: 40, y: 100, width: 300, height: 200 },
      {
        parentId: heroSection.id,
        meta: {
          order: {},
          pluginData: {
            [PLUGIN_SEMANTICS]: { platform: "web", id: "card" },
          },
        },
      },
    );
    const unclassifiedRect = createRect(
      parseShapeId("raw-box"),
      { x: 50, y: 50, width: 200, height: 100 },
      {
        parentId: nestedCard.id,
        meta: { order: {} },
      },
    );
    const leafButton = createRect(
      parseShapeId("cta-btn"),
      { x: 10, y: 10, width: 100, height: 40 },
      {
        parentId: unclassifiedRect.id,
        meta: {
          order: {},
          pluginData: {
            [PLUGIN_SEMANTICS]: { platform: "web", id: "button" },
          },
        },
      },
    );
    const headingText = createText(
      parseShapeId("heading-txt"),
      { x: 20, y: 20, width: 80, height: 24 },
      { parentId: heroSection.id },
    );

    const doc = createDocument([
      rootWeb,
      heroSection,
      nestedCard,
      unclassifiedRect,
      leafButton,
      headingText,
    ]);

    const normalized = normalizeStudioDocument(doc);

    // Root screen is marked
    expect(normalized.shapes[rootWeb.id]?.meta.isContainer).toBe(true);
    // Level 2 Hero Section (section scope) is marked
    expect(normalized.shapes[heroSection.id]?.meta.isContainer).toBe(true);
    // Level 3 Card is marked
    expect(normalized.shapes[nestedCard.id]?.meta.isContainer).toBe(true);
    // Level 4 unclassified structural rectangle is marked
    expect(normalized.shapes[unclassifiedRect.id]?.meta.isContainer).toBe(true);
    // Level 5 Leaf button is NOT marked as container
    expect(normalized.shapes[leafButton.id]?.meta.isContainer).toBeUndefined();
    // Leaf text is NOT marked as container
    expect(normalized.shapes[headingText.id]?.meta.isContainer).toBeUndefined();
  });

  it("marks nested containers across iOS, Android, and Flutter platforms", () => {
    // iOS Screen
    const rootIos = createRect(
      parseShapeId("root-ios"),
      { x: 0, y: 0, width: 393, height: 852 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "ios" },
        },
      },
    );
    const iosNavBar = createRect(
      parseShapeId("ios-navbar"),
      { x: 0, y: 0, width: 393, height: 88 },
      {
        parentId: rootIos.id,
        meta: {
          order: {},
          pluginData: { [PLUGIN_SEMANTICS]: { platform: "ios", id: "navigation-bar" } },
        },
      },
    );

    // Android Screen
    const rootAndroid = createRect(
      parseShapeId("root-android"),
      { x: 500, y: 0, width: 412, height: 915 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "androidNative" },
        },
      },
    );
    const androidAppBar = createRect(
      parseShapeId("android-appbar"),
      { x: 0, y: 0, width: 412, height: 64 },
      {
        parentId: rootAndroid.id,
        meta: {
          order: {},
          pluginData: { [PLUGIN_SEMANTICS]: { platform: "androidNative", id: "top-app-bar" } },
        },
      },
    );

    // Flutter Screen
    const rootFlutter = createRect(
      parseShapeId("root-flutter"),
      { x: 1000, y: 0, width: 400, height: 800 },
      {
        parentId: ROOT_ID,
        meta: {
          order: {},
          pluginData: { [PLUGIN_ROOT_PLATFORM]: "flutter" },
        },
      },
    );
    const flutterDrawer = createRect(
      parseShapeId("flutter-drawer"),
      { x: 0, y: 0, width: 300, height: 800 },
      {
        parentId: rootFlutter.id,
        meta: {
          order: {},
          pluginData: { [PLUGIN_SEMANTICS]: { platform: "flutter", id: "drawer" } },
        },
      },
    );

    const doc = createDocument([
      rootIos,
      iosNavBar,
      rootAndroid,
      androidAppBar,
      rootFlutter,
      flutterDrawer,
    ]);

    const normalized = normalizeStudioDocument(doc);
    expect(normalized.shapes[rootIos.id]?.meta.isContainer).toBe(true);
    expect(normalized.shapes[iosNavBar.id]?.meta.isContainer).toBe(true);
    expect(normalized.shapes[rootAndroid.id]?.meta.isContainer).toBe(true);
    expect(normalized.shapes[androidAppBar.id]?.meta.isContainer).toBe(true);
    expect(normalized.shapes[rootFlutter.id]?.meta.isContainer).toBe(true);
    expect(normalized.shapes[flutterDrawer.id]?.meta.isContainer).toBe(true);
  });

  it("does not mark open strokes or text on root as containers", () => {
    const rootLine = createLine(
      parseShapeId("root-line"),
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { parent: ROOT_ID },
    );
    const rootText = createText(
      parseShapeId("root-text"),
      { x: 0, y: 0, width: 100, height: 30 },
      { parentId: ROOT_ID },
    );
    const doc = createDocument([rootLine, rootText]);
    const normalized = normalizeStudioDocument(doc);

    expect(normalized).toBe(doc);
    expect(normalized.shapes[rootLine.id]?.meta.isContainer).toBeUndefined();
    expect(normalized.shapes[rootText.id]?.meta.isContainer).toBeUndefined();
  });
});

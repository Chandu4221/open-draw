import { describe, expect, it } from "vitest";
import {
  pickRootDeviceButton,
  rootDeviceBarToSvg,
  ROOT_DEVICE_ITEMS,
} from "./overlays/root-device-bar";

describe("rootDeviceBarToSvg", () => {
  const box = { x: 100, y: 100, width: 800, height: 600 };

  it("renders all 6 device buttons", () => {
    const svg = rootDeviceBarToSvg(box, undefined, 1);
    expect(svg).toContain('class="od-root-device-bar"');
    for (const item of ROOT_DEVICE_ITEMS) {
      expect(svg).toContain(`data-device="${item}"`);
    }
  });

  it("marks all as active when activeDeviceType is undefined", () => {
    const svg = rootDeviceBarToSvg(box, undefined, 1);
    expect(svg).toContain(
      'data-device="all" style="cursor: pointer;"><title>All Devices</title><rect x="754.0" y="72.0" width="24.0" height="22.0" rx="3.0" fill="#09090b"',
    );
  });

  it("marks mobile as active when activeDeviceType is mobile", () => {
    const svg = rootDeviceBarToSvg(box, "mobile", 1);
    expect(svg).toContain(
      'data-device="mobile" style="cursor: pointer;"><title>Mobile (390px)</title><rect x="778.0" y="72.0" width="24.0" height="22.0" rx="3.0" fill="#09090b"',
    );
  });

  it("counter-scales dimensions under 2x zoom", () => {
    const svgZoom1 = rootDeviceBarToSvg(box, undefined, 1);
    const svgZoom2 = rootDeviceBarToSvg(box, undefined, 2);

    expect(svgZoom1).toContain('width="148.0"');
    expect(svgZoom2).toContain('width="74.0"');
  });
});

describe("pickRootDeviceButton", () => {
  const box = { x: 100, y: 100, width: 800, height: 600 };

  it("returns all when clicking within the all button", () => {
    // at zoom 1: x = 900 - 148 = 752, y = 70. all button is x: 754 to 778, y: 72 to 94
    const item = pickRootDeviceButton(box, { x: 760, y: 80 }, 1);
    expect(item).toBe("all");
  });

  it("returns mobile when clicking within the mobile button", () => {
    // mobile button is x: 778 to 802, y: 72 to 94
    const item = pickRootDeviceButton(box, { x: 790, y: 80 }, 1);
    expect(item).toBe("mobile");
  });

  it("returns null when clicking outside the device bar", () => {
    const item = pickRootDeviceButton(box, { x: 500, y: 500 }, 1);
    expect(item).toBeNull();
  });

  it("hit-tests correctly under 2x zoom", () => {
    // at zoom 2: scale = 0.5. bar width = 74. x = 900 - 74 = 826, y = 100 - 15 = 85.
    // all button: 827 to 839. mobile button: 839 to 851.
    expect(pickRootDeviceButton(box, { x: 830, y: 90 }, 2)).toBe("all");
    expect(pickRootDeviceButton(box, { x: 845, y: 90 }, 2)).toBe("mobile");
  });
});

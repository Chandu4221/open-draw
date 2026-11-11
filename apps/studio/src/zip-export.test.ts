import { describe, expect, it } from "vitest";
import { computeCrc32, createZip } from "./zip-export";

describe("zip-export", () => {
  it("calculates accurate CRC-32 checksums for string and binary inputs", () => {
    const encoder = new TextEncoder();
    // "123456789" is standard benchmark test vector for CRC-32 (0xCBF43926 = 3421760294)
    const benchmarkBytes = encoder.encode("123456789");
    expect(computeCrc32(benchmarkBytes)).toBe(0xcbf43926);

    // Empty buffer CRC-32 is 0
    expect(computeCrc32(new Uint8Array(0))).toBe(0);
  });

  it("assembles a valid PKZip STORE archive with local and central directory headers", () => {
    const files = [
      { name: "wireframe.md", data: "# Screen Title\n\nWireframe markdown." },
      { name: "wireframe.json", data: '{"schema":1,"shapes":[]}' },
      {
        name: "wireframe.png",
        data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      },
    ];

    const zipBytes = createZip(files);
    expect(zipBytes).toBeInstanceOf(Uint8Array);
    expect(zipBytes.byteLength).toBeGreaterThan(0);

    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);

    // 1. Verify first local file header signature 0x04034b50
    expect(view.getUint32(0, true)).toBe(0x04034b50);

    // 2. Verify compression method is 0 (STORE / uncompressed)
    expect(view.getUint16(8, true)).toBe(0);

    // 3. Search for End of Central Directory signature 0x06054b50 near the end
    let eocdOffset = -1;
    for (let i = zipBytes.byteLength - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }
    expect(eocdOffset).toBeGreaterThan(0);

    // 4. Verify number of entries in EOCD is 3
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    expect(totalEntries).toBe(3);
  });
});

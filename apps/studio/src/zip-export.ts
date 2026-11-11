/**
 * Zero-dependency in-browser PKZip STORE (method 0) generator and downloader.
 * Strict compliance with R-002 (zero external dependencies), R-008, R-010, R-014.
 */

// Precomputed CRC-32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function computeCrc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] ?? 0;
    c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipFileInput {
  readonly name: string;
  readonly data: Uint8Array | string;
}

interface PreparedFile {
  readonly nameBytes: Uint8Array;
  readonly dataBytes: Uint8Array;
  readonly crc: number;
  readonly offset: number;
}

export function createZip(files: ReadonlyArray<ZipFileInput>): Uint8Array {
  const encoder = new TextEncoder();
  const prepared: PreparedFile[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const crc = computeCrc32(dataBytes);
    prepared.push({
      nameBytes,
      dataBytes,
      crc,
      offset: currentOffset,
    });
    // Local header size: 30 bytes + name length + data length
    currentOffset += 30 + nameBytes.length + dataBytes.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const file of prepared) {
    // Central directory header size: 46 bytes + name length
    centralDirSize += 46 + file.nameBytes.length;
  }

  const totalSize = centralDirOffset + centralDirSize + 22; // 22 bytes for EOCD
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // 1. Write Local File Headers and Data
  for (const file of prepared) {
    let p = file.offset;
    view.setUint32(p, 0x04034b50, true); // Local file header signature
    view.setUint16(p + 4, 20, true); // Version needed to extract (2.0)
    view.setUint16(p + 6, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(p + 8, 0, true); // Compression method (0 = STORE)
    view.setUint16(p + 10, 0, true); // Mod time
    view.setUint16(p + 12, 0, true); // Mod date
    view.setUint32(p + 14, file.crc, true); // CRC-32
    view.setUint32(p + 18, file.dataBytes.length, true); // Compressed size
    view.setUint32(p + 22, file.dataBytes.length, true); // Uncompressed size
    view.setUint16(p + 26, file.nameBytes.length, true); // Filename length
    view.setUint16(p + 28, 0, true); // Extra field length
    p += 30;

    buffer.set(file.nameBytes, p);
    p += file.nameBytes.length;

    buffer.set(file.dataBytes, p);
  }

  // 2. Write Central Directory Headers
  let cdPtr = centralDirOffset;
  for (const file of prepared) {
    view.setUint32(cdPtr, 0x02014b50, true); // Central directory header signature
    view.setUint16(cdPtr + 4, 20, true); // Version made by
    view.setUint16(cdPtr + 6, 20, true); // Version needed
    view.setUint16(cdPtr + 8, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(cdPtr + 10, 0, true); // Compression method
    view.setUint16(cdPtr + 12, 0, true); // Mod time
    view.setUint16(cdPtr + 14, 0, true); // Mod date
    view.setUint32(cdPtr + 16, file.crc, true); // CRC-32
    view.setUint32(cdPtr + 20, file.dataBytes.length, true); // Compressed size
    view.setUint32(cdPtr + 24, file.dataBytes.length, true); // Uncompressed size
    view.setUint16(cdPtr + 28, file.nameBytes.length, true); // Filename length
    view.setUint16(cdPtr + 30, 0, true); // Extra field length
    view.setUint16(cdPtr + 32, 0, true); // Comment length
    view.setUint16(cdPtr + 34, 0, true); // Disk start
    view.setUint16(cdPtr + 36, 0, true); // Internal attributes
    view.setUint32(cdPtr + 38, 0, true); // External attributes
    view.setUint32(cdPtr + 42, file.offset, true); // Local header offset
    cdPtr += 46;

    buffer.set(file.nameBytes, cdPtr);
    cdPtr += file.nameBytes.length;
  }

  // 3. Write End of Central Directory Record (EOCD)
  view.setUint32(cdPtr, 0x06054b50, true); // EOCD signature
  view.setUint16(cdPtr + 4, 0, true); // Disk number
  view.setUint16(cdPtr + 6, 0, true); // CD start disk
  view.setUint16(cdPtr + 8, prepared.length, true); // CD records on this disk
  view.setUint16(cdPtr + 10, prepared.length, true); // Total CD records
  view.setUint32(cdPtr + 12, centralDirSize, true); // CD size in bytes
  view.setUint32(cdPtr + 16, centralDirOffset, true); // CD start offset
  view.setUint16(cdPtr + 20, 0, true); // Comment length

  return buffer;
}

export function downloadZip(filename: string, files: ReadonlyArray<ZipFileInput>): void {
  const bytes = createZip(files);
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".zip") ? filename : `${filename}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

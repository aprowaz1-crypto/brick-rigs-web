/**
 * Tiny, dependency-free ZIP reader for the browser.
 *
 * Supports the two compression methods that virtually all .zip files use:
 * stored (0) and deflate (8), via the built-in DecompressionStream API.
 * Everything stays on the device.
 */

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

function findEndOfCentralDirectory(view) {
  const min = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= min; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  return -1;
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Браузер не підтримує розпакування ZIP (DecompressionStream)');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function decodeName(bytes, utf8) {
  try {
    return new TextDecoder(utf8 ? 'utf-8' : 'utf-8', { fatal: false }).decode(bytes);
  } catch {
    return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  }
}

/**
 * Reads a ZIP archive and returns its file entries.
 *
 * @param {ArrayBuffer|Uint8Array} input
 * @param {{ maxEntries?: number, maxEntrySize?: number }} options
 * @returns {Promise<Array<{ name: string, size: number, data: Uint8Array }>>}
 */
export async function readZip(input, options = {}) {
  const maxEntries = options.maxEntries || 4000;
  const maxEntrySize = options.maxEntrySize || 64 * 1024 * 1024;
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const eocd = findEndOfCentralDirectory(view);
  if (eocd < 0) throw new Error('Це не схоже на ZIP-архів');

  const totalEntries = view.getUint16(eocd + 10, true);
  let directoryOffset = view.getUint32(eocd + 16, true);
  if (totalEntries === 0xffff || directoryOffset === 0xffffffff) {
    throw new Error('ZIP64 не підтримується — розпакуй архів вручну');
  }

  const entries = [];
  let offset = directoryOffset;
  for (let index = 0; index < totalEntries && index < maxEntries; index += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new Error('Пошкоджений ZIP: не знайдено центральний каталог');
    }

    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    let compressedSize = view.getUint32(offset + 20, true);
    let uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    const name = decodeName(nameBytes, Boolean(flags & 0x0800));
    offset += 46 + nameLength + extraLength + commentLength;

    if (name.endsWith('/')) continue;
    if (flags & 0x0001) continue; // encrypted entries are not supported
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error('ZIP64 не підтримується — розпакуй архів вручну');
    }

    if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) {
      throw new Error(`Пошкоджений ZIP: файл ${name}`);
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) {
      throw new Error(`Пошкоджений ZIP: файл ${name} обірваний`);
    }
    if (uncompressedSize > maxEntrySize) continue;

    const raw = bytes.subarray(dataStart, dataEnd);
    let data;
    if (method === 0) {
      data = raw.slice();
    } else if (method === 8) {
      data = await inflateRaw(raw);
    } else {
      continue;
    }

    entries.push({ name, size: data.length, data });
  }

  return entries;
}

export function findZipVehicleEntries(entries) {
  return entries.filter((entry) => /\.brv$/i.test(entry.name));
}

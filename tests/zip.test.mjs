import test from 'node:test';
import assert from 'node:assert/strict';
import { readZip, findZipVehicleEntries } from '../js/zip.js';

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function deflateRaw(bytes) {
  const stream = new CompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  await writer.write(bytes);
  await writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

async function makeZip(name, content) {
  const data = new TextEncoder().encode(content);
  const compressed = await deflateRaw(data);
  const nameBytes = new TextEncoder().encode(name);
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt32LE(0, 42);

  const body = Buffer.concat([local, Buffer.from(nameBytes), Buffer.from(compressed)]);
  const directory = Buffer.concat([central, Buffer.from(nameBytes)]);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(body.length, 16);
  return Buffer.concat([body, directory, eocd]);
}

test('zip reader extracts deflate entries and UTF-8 names', async () => {
  const zip = await makeZip('Saves/Моя машина.brv', 'hello bricks');
  const entries = await readZip(zip);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, 'Saves/Моя машина.brv');
  assert.equal(new TextDecoder().decode(entries[0].data), 'hello bricks');
  assert.equal(findZipVehicleEntries(entries).length, 1);
});

test('zip reader rejects non-zip data', async () => {
  await assert.rejects(() => readZip(new Uint8Array(32)), /ZIP/);
});

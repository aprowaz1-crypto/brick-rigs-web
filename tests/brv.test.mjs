import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseBRV, colorToHex, formatCm, vehicleLabel, colorToRgb } from '../js/brv.js';

const root = fileURLToPath(new URL('..', import.meta.url));

function readAsset(name) {
  return fs.readFileSync(`${root}assets/${name}`);
}

test('demo sports car parses into a drivable vehicle', () => {
  const vehicle = parseBRV(readAsset('demo-car.brv'));
  assert.equal(vehicle.version, 18);
  assert.equal(vehicle.brickCount, 15);
  assert.equal(vehicle.stats.bricks, 15);
  assert.equal(vehicle.stats.types, 2);
  assert.equal(vehicle.stats.wheels, 4);
  assert.equal(vehicle.bricks[0].type, 'ScalableBrick');
  assert.deepEqual(vehicle.bricks[0].dims, {
    x: 380,
    y: 170,
    z: 30,
    shape: 'box',
    studs: false,
    scalable: true,
  });
  assert.equal(colorToHex(vehicle.bricks[0].color), '#dc282d');
  assert.ok(vehicle.bounds.size.x > 400);
  assert.ok(vehicle.bounds.size.z > 100);
});

test('demo truck has six wheels and a colour palette', () => {
  const vehicle = parseBRV(readAsset('demo-truck.brv'));
  assert.equal(vehicle.bricks.length, 14);
  assert.equal(vehicle.stats.wheels, 6);
  assert.ok(vehicle.stats.types >= 2);
  const colors = new Set(vehicle.bricks.map((brick) => colorToHex(brick.color)));
  assert.ok(colors.size >= 4);
  assert.match(vehicleLabel(vehicle), /м/);
});

test('colour conversion keeps alpha and RGB channels', () => {
  assert.deepEqual(colorToRgb(0xdc282dff), {
    r: 220 / 255,
    g: 40 / 255,
    b: 45 / 255,
    a: 1,
  });
  assert.equal(colorToHex(0x000000ff), '#000000');
  assert.equal(colorToHex(0xffffffff), '#ffffff');
});

test('size formatting uses centimetres and metres', () => {
  assert.equal(formatCm(80), '80 см');
  assert.equal(formatCm(100), '1.0 м');
  assert.equal(formatCm(417.5), '4.2 м');
  assert.equal(formatCm(Number.NaN), '—');
});

test('a truncated or fake file is rejected', () => {
  assert.throws(() => parseBRV(new Uint8Array([1, 2, 3])));
  const fake = new Uint8Array(64);
  fake[0] = 99;
  assert.throws(() => parseBRV(fake), /Невідома версія/);
});

/**
 * Minimal, dependency-free reader for Brick Rigs vehicle files (.brv).
 *
 * The format is documented by the BrickEdit project (GPL-3.0):
 * https://github.com/MrPerruche/BrickEdit
 *
 * This module only reads geometry and a handful of display properties.
 * It never uploads or stores the file: everything happens in the browser.
 */

const decoder = new TextDecoder('ascii');

export const DEFAULT_COLOR = 0xbcbcbcff;

function decodeEnum(bytes) {
  if (!bytes.length) return '';
  const len = bytes[0];
  return decoder.decode(bytes.subarray(1, 1 + len));
}

function decodeProperty(name, bytes) {
  if (!bytes || !bytes.length) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  switch (name) {
    case 'BrickColor':
      return bytes.length >= 4 ? dv.getUint32(0, false) : DEFAULT_COLOR;
    case 'BrickSize':
      return bytes.length >= 12
        ? { x: dv.getFloat32(0, true), y: dv.getFloat32(4, true), z: dv.getFloat32(8, true) }
        : null;
    case 'PatternOffset':
    case 'PatternScale':
      return bytes.length >= 8
        ? { x: dv.getFloat32(0, true), y: dv.getFloat32(4, true) }
        : null;
    case 'ConnectorSpacing':
      return bytes.length >= 2 ? dv.getUint16(0, true) : null;
    case 'BrickMaterial':
    case 'BrickPattern':
      return decodeEnum(bytes);
    case 'WheelDiameter':
    case 'WheelWidth':
    case 'TireThickness':
    case 'TirePressureRatio':
    case 'PatternRotation':
    case 'SteeringAngle':
    case 'SteeringSpeed':
    case 'SuspensionLength':
    case 'SuspensionStiffness':
    case 'SuspensionDamping':
    case 'BrakeStrength':
    case 'Brightness':
    case 'GearRatio':
    case 'HornPitch':
    case 'InputScale':
    case 'MinLimit':
    case 'MaxLimit':
    case 'MinAngle':
    case 'MaxAngle':
    case 'SpinnerAngle':
    case 'SpinnerRadius':
    case 'SpeedFactor':
    case 'WheelDiameter':
    case 'WheelWidth':
    case 'Yaw':
      return bytes.length >= 4 ? dv.getFloat32(0, true) : null;
    default:
      break;
  }

  // Booleans in Brick Rigs are stored as a single byte and usually start with b.
  if (bytes.length === 1 && (/^b[A-Z]/.test(name) || name === 'bGenerateLift')) {
    return bytes[0] !== 0;
  }
  // Vectors and colours are handled above. Most remaining numeric strings are floats.
  if (bytes.length === 4) return dv.getFloat32(0, true);
  if (bytes.length === 8) {
    return { x: dv.getFloat32(0, true), y: dv.getFloat32(4, true) };
  }
  if (bytes.length === 12) {
    return {
      x: dv.getFloat32(0, true),
      y: dv.getFloat32(4, true),
      z: dv.getFloat32(8, true),
    };
  }
  // Enums: one length byte followed by ASCII.
  if (bytes.length > 1 && bytes[0] === bytes.length - 1) {
    const value = decodeEnum(bytes);
    if (/^[\x20-\x7e]*$/.test(value)) return value;
  }
  return bytes;
}

function readString(view, state) {
  const len = view.getUint8(state.offset);
  state.offset += 1;
  const value = decoder.decode(
    new Uint8Array(view.buffer, view.byteOffset + state.offset, len)
  );
  state.offset += len;
  return value;
}

function parseTypeDimensions(type) {
  const match = type.match(
    /^(BrickRoundedCorner|BrickRounded|CornerBrick|Brick|Weight)_(\d+)x(\d+)x(\d+)(s)?(_Flat)?$/
  );
  if (!match) return null;
  const x = Number(match[2]);
  const y = Number(match[3]);
  const z = Number(match[4]);
  const isFlat = Boolean(match[6]);
  // Brick Rigs uses centimetres. One stud is 8 cm wide; a regular brick is 9.6 cm tall.
  return {
    x: x * 8,
    y: y * 8,
    z: z * (isFlat ? 3.2 : 9.6),
    shape: 'box',
    studs: !isFlat,
  };
}

function parseRoundDimensions(type) {
  const match = type.match(/(?:Zylinder|Cylinder|Barrel|Cone|Sphere)_(\d+)x(\d+)x(\d+)(s)?(_Flat)?$/);
  if (!match) return null;
  const x = Number(match[1]) * 8;
  const y = Number(match[2]) * 8;
  const z = Number(match[3]) * (match[5] ? 3.2 : 9.6);
  const isCone = type.startsWith('Cone');
  const isSphere = type.startsWith('Sphere');
  return {
    x,
    y,
    z,
    shape: isSphere ? 'sphere' : isCone ? 'cone' : 'cylinder',
    axis: 'z',
    studs: false,
  };
}

function parseWheel(type, props) {
  if (!/Wheel/i.test(type) && !/^Axle_/i.test(type)) return null;
  const isAxle = /^Axle_/i.test(type);
  const diameter = Number(props.WheelDiameter);
  const width = Number(props.WheelWidth);
  const d = Number.isFinite(diameter) && diameter > 0 ? diameter : 70;
  let w = Number.isFinite(width) && width > 0 ? width : d * 0.3;
  // Some vanilla wheels store their width in decimetres (4 means 40 cm).
  if (w < 10) w *= 10;
  if (isAxle) {
    return { x: d, y: w, z: d, shape: 'cylinder', axis: 'y', studs: false, axle: true };
  }
  return { x: d, y: w, z: d, shape: 'wheel', axis: 'y', studs: false, wheel: true };
}

export function brickDimensions(type, props) {
  if (props && props.BrickSize && typeof props.BrickSize === 'object') {
    return {
      x: props.BrickSize.x,
      y: props.BrickSize.y,
      z: props.BrickSize.z,
      shape: 'box',
      studs: false,
      scalable: true,
    };
  }
  return (
    parseWheel(type, props) ||
    parseTypeDimensions(type) ||
    parseRoundDimensions(type) || {
      x: 24,
      y: 24,
      z: 24,
      shape: 'box',
      studs: false,
      fallback: true,
    }
  );
}

function makeBrick(index, type, position, rotation, props, groups) {
  const dims = brickDimensions(type, props);
  const color = Number.isFinite(props.BrickColor) ? props.BrickColor : DEFAULT_COLOR;
  return {
    index,
    type,
    pos: position,
    rot: rotation,
    props,
    dims,
    color,
    material: typeof props.BrickMaterial === 'string' ? props.BrickMaterial : 'Plastic',
    pattern: typeof props.BrickPattern === 'string' ? props.BrickPattern : 'None',
    weld: groups.weld,
    editor: groups.editor,
  };
}

function halfExtents(brick) {
  const { x, y, z, shape, axis } = brick.dims;
  if (shape === 'wheel' || (shape === 'cylinder' && axis === 'y')) {
    return { x: x / 2, y: y / 2, z: z / 2 };
  }
  if (shape === 'cylinder' || shape === 'cone' || shape === 'sphere') {
    const radius = Math.max(x, y) / 2;
    return { x: radius, y: radius, z: z / 2 };
  }
  return { x: x / 2, y: y / 2, z: z / 2 };
}

function rotatedHalfExtents(half, rotation) {
  const rx = ((rotation.x || 0) * Math.PI) / 180;
  const ry = ((rotation.y || 0) * Math.PI) / 180;
  const rz = ((rotation.z || 0) * Math.PI) / 180;
  const c1 = Math.cos(rx);
  const s1 = Math.sin(rx);
  const c2 = Math.cos(ry);
  const s2 = Math.sin(ry);
  const c3 = Math.cos(rz);
  const s3 = Math.sin(rz);

  // Three.js Euler order XYZ.
  const m00 = c2 * c3;
  const m01 = -c2 * s3;
  const m02 = s2;
  const m10 = c1 * s3 + s1 * s2 * c3;
  const m11 = c1 * c3 - s1 * s2 * s3;
  const m12 = -s1 * c2;
  const m20 = s1 * s3 - c1 * s2 * c3;
  const m21 = s1 * c3 + c1 * s2 * s3;
  const m22 = c1 * c2;

  return {
    x: Math.abs(m00) * half.x + Math.abs(m01) * half.y + Math.abs(m02) * half.z,
    y: Math.abs(m10) * half.x + Math.abs(m11) * half.y + Math.abs(m12) * half.z,
    z: Math.abs(m20) * half.x + Math.abs(m21) * half.y + Math.abs(m22) * half.z,
  };
}

function calculateBounds(bricks) {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const brick of bricks) {
    const half = rotatedHalfExtents(halfExtents(brick), brick.rot);
    min.x = Math.min(min.x, brick.pos.x - half.x);
    min.y = Math.min(min.y, brick.pos.y - half.y);
    min.z = Math.min(min.z, brick.pos.z - half.z);
    max.x = Math.max(max.x, brick.pos.x + half.x);
    max.y = Math.max(max.y, brick.pos.y + half.y);
    max.z = Math.max(max.z, brick.pos.z + half.z);
  }
  if (!bricks.length) {
    return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 }, size: { x: 0, y: 0, z: 0 } };
  }
  return {
    min,
    max,
    size: { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z },
  };
}

export function parseBRV(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length < 7) throw new Error('Файл закороткий для .brv');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const state = { offset: 0 };

  const u8 = () => view.getUint8(state.offset++);
  const u16 = () => {
    const value = view.getUint16(state.offset, true);
    state.offset += 2;
    return value;
  };
  const u32 = () => {
    const value = view.getUint32(state.offset, true);
    state.offset += 4;
    return value;
  };
  const f32 = () => {
    const value = view.getFloat32(state.offset, true);
    state.offset += 4;
    return value;
  };

  const version = u8();
  if (version < 1 || version > 32) {
    throw new Error(`Невідома версія .brv: ${version}`);
  }

  const brickCount = u16();
  const typeCount = u16();
  const propertyCount = u16();

  const brickTypes = [];
  for (let i = 0; i < typeCount; i += 1) brickTypes.push(readString(view, state));

  const properties = [];
  const propertyValues = new Map();
  for (let i = 0; i < propertyCount; i += 1) {
    const name = readString(view, state);
    const valueCount = u16();
    const totalLength = u32();

    // All values are stored together, followed by an optional footer that
    // describes their individual lengths.
    const rawValues = bytes.subarray(state.offset, state.offset + totalLength);
    state.offset += totalLength;

    let lengths;
    if (valueCount > 1) {
      const first = u16();
      if (first === 0) {
        lengths = [];
        for (let j = 0; j < valueCount; j += 1) lengths.push(u16());
      } else {
        lengths = new Array(valueCount).fill(first);
      }
    } else {
      lengths = [totalLength];
    }

    const values = [];
    let valueOffset = 0;
    for (const length of lengths) {
      const raw = rawValues.subarray(valueOffset, valueOffset + length);
      valueOffset += length;
      values.push(decodeProperty(name, raw));
    }
    properties.push({ name, values });
    propertyValues.set(name, values);
  }

  const bricks = [];
  const supported = version >= 17;
  for (let i = 0; i < brickCount; i += 1) {
    const typeIndex = u16();
    const type = brickTypes[typeIndex];
    if (!type) throw new Error(`Пошкоджений файл: невідомий тип цеглинки #${typeIndex}`);

    u32(); // size of this brick's property block
    const localCount = u8();
    const props = {};
    for (let j = 0; j < localCount; j += 1) {
      const propertyIndex = u16();
      const valueIndex = u16();
      const property = properties[propertyIndex];
      if (!property) continue;
      props[property.name] = property.values[valueIndex];
    }

    const pos = { x: f32(), y: f32(), z: f32() };
    const rotY = f32();
    const rotZ = f32();
    const rotX = f32();
    let weld = null;
    let editor = null;
    if (supported) {
      editor = u16();
      weld = u16();
    }

    bricks.push(
      makeBrick(
        i,
        type,
        pos,
        { x: rotX, y: rotY, z: rotZ },
        props,
        {
          weld: weld ? `weld_${weld}` : null,
          editor: editor ? `editor_${editor}` : null,
        }
      )
    );
  }

  if (state.offset > bytes.length) {
    throw new Error('Файл обірваний: не вдалося прочитати всі цеглинки');
  }

  const bounds = calculateBounds(bricks);
  const typeCounts = new Map();
  for (const brick of bricks) {
    typeCounts.set(brick.type, (typeCounts.get(brick.type) || 0) + 1);
  }

  return {
    version,
    brickCount,
    brickTypes,
    properties: properties.map((property) => property.name),
    bricks,
    bounds,
    stats: {
      bricks: bricks.length,
      types: typeCounts.size,
      wheels: bricks.filter((brick) => brick.dims.wheel).length,
      sizeCm: bounds.size,
    },
  };
}

export function colorToRgb(color) {
  const value = Number.isFinite(color) ? color >>> 0 : DEFAULT_COLOR;
  return {
    r: ((value >>> 24) & 0xff) / 255,
    g: ((value >>> 16) & 0xff) / 255,
    b: ((value >>> 8) & 0xff) / 255,
    a: (value & 0xff) / 255,
  };
}

export function colorToHex(color) {
  const { r, g, b } = colorToRgb(color);
  return (
    '#' +
    [r, g, b]
      .map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function formatCm(value) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 100) return `${(value / 100).toFixed(1)} м`;
  return `${Math.round(value)} см`;
}

export function vehicleLabel(vehicle) {
  if (!vehicle) return '';
  const { sizeCm } = vehicle.stats;
  return `${formatCm(sizeCm.x)} × ${formatCm(sizeCm.y)} × ${formatCm(sizeCm.z)}`;
}

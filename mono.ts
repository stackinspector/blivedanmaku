const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const encodeText = (input: string) => textEncoder.encode(input);
const decodeText = (input: Uint8Array) => textDecoder.decode(input);

const sumof = (array: number[]): number => array.reduce((a, b) => a + b);

const range = function* (end: number, start = 0, step = 1) {
  for (let i = start; i < end; i += step) yield i;
};

const concat_bytes = (...bins: Uint8Array[]): Uint8Array => {
  let length = 0;
  for (const bin of bins) {
    length += bin.byteLength;
  }
  const concated = new Uint8Array(length);
  for (const i of range(bins.length)) {
    concated.set(bins[i], i === 0 ? 0 : bins[i - 1].byteLength);
  }
  return concated;
};

const head_schema = [4, 2, 2, 4, 4];
const head_length = sumof(head_schema);

const encode_u32 = (data: number): ArrayBuffer => {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint32(0, data);
  return buf;
};

const decode_u32 = (buf: ArrayBuffer): number => new DataView(buf).getUint32(0);

export type Head = {
  length: number;
  head_length: number;
  proto_ver: number;
  msg_type: number;
  seq: number;
};

const encode_head = (head: Head): ArrayBuffer => {
  const buf = new ArrayBuffer(head_length);
  const view = new DataView(buf);
  let offset = 0;
  view.setUint32(offset, head.length);
  offset += head_schema[0];
  view.setUint16(offset, head.head_length);
  offset += head_schema[1];
  view.setUint16(offset, head.proto_ver);
  offset += head_schema[2];
  view.setUint32(offset, head.msg_type);
  offset += head_schema[3];
  view.setUint32(offset, head.seq);
  offset += head_schema[4];
  return buf;
};

const decode_head = (buf: ArrayBuffer): Head => {
  const view = new DataView(buf);
  let offset = 0;
  const length = view.getUint32(offset);
  offset += head_schema[0];
  const head_length = view.getUint16(offset);
  offset += head_schema[1];
  const proto_ver = view.getUint16(offset);
  offset += head_schema[2];
  const msg_type = view.getUint32(offset);
  offset += head_schema[3];
  const seq = view.getUint32(offset);
  offset += head_schema[4];
  return { length, head_length, proto_ver, msg_type, seq };
};

export const enum PackageType {
  InitRequest,
  InitResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  Json,
  MultiJson,
}

const encode_payload = (type: PackageType, payload: unknown): Uint8Array => {
  switch (type) {
    case PackageType.Json:
    case PackageType.InitRequest:
    case PackageType.InitResponse:
      return encodeText(JSON.stringify(payload));
    case PackageType.HeartbeatRequest:
      return encodeText(payload as string);
    case PackageType.HeartbeatResponse:
      return new Uint8Array(encode_u32(payload as number));
    default:
      throw new Error("not encodable");
  }
};

const decode_payload = (type: PackageType, payload: Uint8Array): unknown => {
  switch (type) {
    case PackageType.Json:
    case PackageType.InitRequest:
    case PackageType.InitResponse:
      return JSON.parse(decodeText(payload)) as unknown;
    case PackageType.HeartbeatRequest:
      return decodeText(payload);
    case PackageType.HeartbeatResponse:
      return decode_u32(payload.buffer);
    case PackageType.MultiJson:
      return unpack(payload);
  }
};

const encode_msg_type = (type: PackageType): number => {
  switch (type) {
    case PackageType.HeartbeatRequest:
      return 2;
    case PackageType.InitRequest:
      return 7;
    default:
      throw new Error("not encodable");
  }
};

const build_head = (payload_length: number, type: PackageType): Head => ({
  length: head_length + payload_length,
  head_length,
  proto_ver: 1,
  msg_type: encode_msg_type(type),
  seq: 1,
});

const explain_head = (head: Head): PackageType => {
  switch (head.proto_ver) {
    case 3:
      return PackageType.MultiJson;
    case 0:
      return PackageType.Json;
    case 1:
      switch (head.msg_type) {
        case 3:
          return PackageType.HeartbeatResponse;
        case 8:
          return PackageType.InitResponse;
        default:
          throw new Error("unknown msg type");
      }
    default:
      throw new Error("unknown proto ver");
  }
};

const unpack = (data: Uint8Array) => {
  const result = [];
  const source = br_decode(data);
  let offset = 0;
  while (offset < source.byteLength) {
    const length = decode_u32(source.slice(offset).buffer);
    result.push(decode(source.slice(offset, offset + length)));
    offset += length;
  }
  return result;
};

export const encode = (type: PackageType, data: unknown): Uint8Array => {
  const payload = encode_payload(type, data);
  const head = encode_head(build_head(type, payload.byteLength));
  return concat_bytes(new Uint8Array(head), payload);
};

export const decode = (raw: ArrayBuffer) => {
  const type = explain_head(decode_head(raw.slice(0, head_length)));
  return {
    type,
    data: decode_payload(type, new Uint8Array(raw.slice(head_length))),
  };
};

const text_encoder = new TextEncoder();
const text_decoder = new TextDecoder();
const encode_text = (input: string) => text_encoder.encode(input);
const decode_text = (input: Uint8Array) => text_decoder.decode(input);

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

declare const br_decode: (buf: Uint8Array) => Uint8Array;

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
  view.setUint16(offset += head_schema[0], head.head_length);
  view.setUint16(offset += head_schema[1], head.proto_ver);
  view.setUint32(offset += head_schema[2], head.msg_type);
  view.setUint32(offset += head_schema[3], head.seq);
  return buf;
};

const decode_head = (buf: ArrayBuffer): Head => {
  const view = new DataView(buf);
  let offset = 0;
  const length = view.getUint32(offset);
  const head_length = view.getUint16(offset += head_schema[0]);
  const proto_ver = view.getUint16(offset += head_schema[1]);
  const msg_type = view.getUint32(offset += head_schema[2]);
  const seq = view.getUint32(offset += head_schema[3]);
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

export type Package = {
  type: PackageType.InitRequest;
  payload: unknown;
} | {
  type: PackageType.InitResponse;
  payload: unknown;
} | {
  type: PackageType.HeartbeatRequest;
  payload: string;
} | {
  type: PackageType.HeartbeatResponse;
  payload: number;
} | {
  type: PackageType.Json;
  payload: unknown;
} | {
  type: PackageType.MultiJson;
  payload: Package[];
};

const build_head = (payload_length: number, type: PackageType): Head => ({
  length: head_length + payload_length,
  head_length,
  proto_ver: 1,
  msg_type: (() => {
    switch (type) {
      case PackageType.HeartbeatRequest:
        return 2;
      case PackageType.InitRequest:
        return 7;
      default:
        throw new Error("not encodable");
    }
  })(),
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

const unpack = (data: Uint8Array): Package[] => {
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

export const decode = (raw: ArrayBuffer): Package => {
  const type = explain_head(decode_head(raw.slice(0, head_length)));
  const payload = new Uint8Array(raw.slice(head_length));
  switch (type) {
    case PackageType.Json:
    case PackageType.InitRequest:
    case PackageType.InitResponse:
      return { type, payload: JSON.parse(decode_text(payload)) as unknown };
    case PackageType.MultiJson:
      return { type, payload: unpack(payload) };
    case PackageType.HeartbeatRequest:
      return { type, payload: decode_text(payload) };
    case PackageType.HeartbeatResponse:
      return { type, payload: decode_u32(payload.buffer) };
  }
};

export const encode = (pack: Package): Uint8Array => {
  const payload = (() => {
    switch (pack.type) {
      case PackageType.Json:
      case PackageType.InitRequest:
      case PackageType.InitResponse:
        return encode_text(JSON.stringify(pack.payload));
      case PackageType.HeartbeatRequest:
        return encode_text(pack.payload as string);
      case PackageType.HeartbeatResponse:
        return new Uint8Array(encode_u32(pack.payload as number));
      default:
        throw new Error("not encodable");
    }
  })();
  const head = encode_head(build_head(pack.type, payload.byteLength));
  return concat_bytes(new Uint8Array(head), payload);
};

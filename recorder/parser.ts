import { encode as textEncode, decode as textDecode } from 'std/encoding/utf8.ts'
import { inflate } from 'third/zlib.es/mod.ts'
import * as bindata from 'baseutil/bindata.ts'
import type { Source, Target } from './schema.ts'
import { types } from './schema.ts'
import * as codec from './codec.ts'
import { dump } from './pre.ts'
export { encode, decode }

const jsonEncode = (data: unknown): Uint8Array => textEncode(JSON.stringify(data))
const jsonDecode = (data: Uint8Array): unknown => JSON.parse(textDecode(data)) as unknown
const u32Encode = (data: number): Uint8Array => new Uint8Array(bindata.encode([data], [32]))
const u32Decode = (data: Uint8Array): number => bindata.decode(data.buffer, [32])[0]

const extjson = (data: Uint8Array): Source<unknown>[] => {
    const result: Uint8Array[] = []
    const source = inflate(data)
    let offset = 0
    while (offset < source.byteLength) {
        const length = new DataView(source.slice(offset).buffer).getUint32(0)
        result.push(source.slice(offset, offset + length))
        offset += length
        dump<number[]>({ type: 'debug', time: Number(new Date()), data: [length, offset, source.byteLength] }, 'debug')
    }
    return result.map(bin => decode(codec.decode(bin.buffer)))
}

const _encode = (src: Source<unknown>): Uint8Array => {
    switch (src.type) {
        case types.json:
        case types.init_req:
        case types.init_resp:
            return jsonEncode(src.data)
        case types.heartbeat_req:
            return textEncode(src.data as string)
        case types.heartbeat_resp:
            return u32Encode(src.data as number)
        case types.extjson:
        case types.unknown:
            return new Uint8Array([])
    }
}

const _decode = (src: Target<types>): unknown => {
    switch (src.type) {
        case types.json:
        case types.init_req:
        case types.init_resp:
            return jsonDecode(src.data)
        case types.heartbeat_req:
            return textDecode(src.data)
        case types.heartbeat_resp:
            return u32Decode(src.data)
        case types.extjson:
            return extjson(src.data)
        case types.unknown:
            return null
    }
}

const encode = (src: Source<unknown>): Target<types> => ({
    type: src.type,
    data: _encode(src)
})

const decode = (src: Target<types>): Source<unknown> => ({
    type: src.type,
    data: _decode(src)
})


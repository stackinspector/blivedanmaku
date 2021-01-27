import { encode as encodeText, decode as decodeText } from 'std/encoding/utf8.ts'
import { inflate } from 'third/zlib.es/mod.ts'
import { encodeUint, decodeUint } from 'baseutil/bindata.ts'
import type { Source, Target } from './schema.ts'
import { types } from './schema.ts'
import * as codec from './codec.ts'
import { dump } from './pre.ts'
export { encode, decode }

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
            return encodeText(JSON.stringify(src.data))
        case types.heartbeat_req:
            return encodeText(src.data as string)
        case types.heartbeat_resp:
            return new Uint8Array(encodeUint(src.data as number, 32))
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
            return JSON.parse(decodeText(src.data)) as unknown
        case types.heartbeat_req:
            return decodeText(src.data)
        case types.heartbeat_resp:
            return decodeUint(src.data.buffer, 32)
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


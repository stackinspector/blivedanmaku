import { encode as textEncode, decode as textDecode } from 'std/encoding/utf8.ts'
import { encode as base64Encode } from 'std/encoding/base64.ts'
import type { Dict } from 'baseutil/fetchlot.ts'
import * as bindata from 'baseutil/bindata.ts'
import type { Source, Target } from './schema.ts'
import { types } from './schema.ts'
export { encode, decode }

const jsonEncode = (data: Dict) => textEncode(JSON.stringify(data))
const jsonDecode = (data: Uint8Array) => JSON.parse(textDecode(data)) as Dict
const u32Encode = (data: number) => new Uint8Array(bindata.encode([data], [32]))
const u32Decode = (data: Uint8Array) => bindata.decode(data.buffer, [32])

// const extjson = (src: Target<types>): Source<Source<unknown>>

const extjson = (data: Uint8Array): string => base64Encode(data)

const encode = (src: Source<unknown>): Uint8Array => {
    switch (src.type) {
        case types.json:
        case types.init_req:
        case types.init_resp:
            return jsonEncode(src.data as Dict)
        case types.heartbeat_req:
            return textEncode(src.data as string)
        case types.heartbeat_resp:
            return u32Encode(src.data as number)
        case types.extjson:
        case types.unknown:
            return new Uint8Array([])
    }
}

const decode = (src: Target<types>): unknown => {
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


import { encodeText, decodeText } from 'baseutil/textcodec.ts'
import { inflate } from 'third/zlib.es/mod.ts'
import { encodeUint, decodeUint } from 'baseutil/bindata.ts'
import type { Source, Target } from './schema.ts'
import { PackageType } from './schema.ts'
import * as codec from './codec.ts'
import { dump } from './pre.ts'
export { encode, decode }

const unpack = (data: Uint8Array): Source<unknown>[] => {
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
        case PackageType.Json:
        case PackageType.InitRequest:
        case PackageType.InitResponse:
            return encodeText(JSON.stringify(src.data))
        case PackageType.HeartbeatRequest:
            return encodeText(src.data as string)
        case PackageType.HeartbeatResponse:
            return new Uint8Array(encodeUint(src.data as number, 32))
        case PackageType.MultiJson:
        case PackageType.Unknown:
            return new Uint8Array([])
    }
}

const _decode = (src: Target<PackageType>): unknown => {
    switch (src.type) {
        case PackageType.Json:
        case PackageType.InitRequest:
        case PackageType.InitResponse:
            return JSON.parse(decodeText(src.data)) as unknown
        case PackageType.HeartbeatRequest:
            return decodeText(src.data)
        case PackageType.HeartbeatResponse:
            return decodeUint(src.data.buffer, 32)
        case PackageType.MultiJson:
            return unpack(src.data)
        case PackageType.Unknown:
            return null
    }
}

const encode = (src: Source<unknown>): Target<PackageType> => ({
    type: src.type,
    data: _encode(src)
})

const decode = (src: Target<PackageType>): Source<unknown> => ({
    type: src.type,
    data: _decode(src)
})


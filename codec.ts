import type { bit } from 'baseutil/bindata.ts'
import * as bindata from 'baseutil/bindata.ts'
export { types, encode, decode }

const headbit: bit[] = [32, 16, 16, 32, 32]

enum types {
    unknown,
    init_req,
    init_resp,
    heartbeat_req,
    heartbeat_resp,
    json,
    extjson,
}

type reqtypes = types.init_req | types.heartbeat_req

type Head = [number, number, number]

const encodeHead = (type: reqtypes): Head => {
    const wrap = (x: number): Head => [1, x, 1]
    switch (type) {
        case types.heartbeat_req: return wrap(2)
        case types.init_req: return wrap(7)
    }
}

const decodehead = (head: Head): types => {
    if (head[1] === 5 && head[2] === 0) {
        // JSON data
        switch (head[0]) {
            case 2: return types.extjson
            case 0: return types.json
        }
    }
    if (head[0] === 1 && head[2] === 1) {
        // interact response
        switch (head[1]) {
            case 3: return types.heartbeat_resp
            case 8: return types.init_resp
        }
    }
    return types.unknown
}

const encode = (type: reqtypes, data: Uint8Array): ArrayBuffer =>
    bindata.concat(new Uint8Array(bindata.encode(
        [16 + data.byteLength, 16].concat(encodeHead(type)), headbit
    )), data).buffer


const decode = (stream: ArrayBuffer): [types, Uint8Array] => [
    decodehead(bindata.decode(stream.slice(0, 16), headbit).slice(2, 5) as Head), new Uint8Array(stream.slice(16))
]


import type { bit } from 'baseutil/bindata.ts'
import * as bindata from 'baseutil/bindata.ts'
export { types, encode, decode }

const headbit: bit[] = [32, 16, 16, 32, 32]

enum types {
    init_req,
    init_resp,
    heartbeat_req,
    heartbeat_resp,
    json,
    extjson,
}

type Head = [number, number, number]

const jsondata = new Map([
    [2, types.extjson],
    [0, types.json],
])

// deno-lint-ignore camelcase
const interact_req = new Map([
    [types.heartbeat_req, 2],
    [types.init_req, 7],
])

// deno-lint-ignore camelcase
const interact_resp = new Map([
    [3, types.heartbeat_resp],
    [8, types.init_resp],
])

const encodeHead = (type: types): Head => [1, interact_req.get(type) as types, 1]

const decodehead = (head: Head): types | undefined => {
    if (head[1] === 5 && head[2] === 0) return jsondata.get(head[0])
    else if (head[0] === 1 && head[2] === 1) return interact_resp.get(head[1])
}

const encode = (type: types, data: Uint8Array): ArrayBuffer =>
    bindata.concat(new Uint8Array(bindata.encode(
        [16 + data.byteLength, 16].concat(encodeHead(type)), headbit
    )), data).buffer


const decode = (stream: ArrayBuffer): [types | undefined, Uint8Array] => [
    decodehead(bindata.decode(stream.slice(0, 16), headbit).slice(2, 5) as Head), new Uint8Array(stream.slice(16))
]


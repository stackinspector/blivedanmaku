import { sumof } from 'baseutil/sum.ts'
import * as bindata from 'baseutil/bindata.ts'
import type { Target, Head } from './schema.ts'
import { types, headbit } from './schema.ts'
export { encode, decode }

const headlength = sumof(headbit) / 8

const _encode = (type: types): Head => {
    const wrap = (x: number): Head => [1, x, 1]
    switch (type) {
        case types.heartbeat_req: return wrap(2)
        case types.init_req: return wrap(7)
        default: return wrap(0)
    }
}

const _decode = (head: Head): types => {
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

const encode = (pkg: Target<types>): ArrayBuffer =>
    bindata.concat(
        new Uint8Array(
            bindata.encode(
                [headlength + pkg.data.byteLength, headlength].concat(_encode(pkg.type)),
                headbit
            )
        ),
        pkg.data
    ).buffer

const decode = (stream: ArrayBuffer): Target<types> => {

    const head = bindata.decode(stream.slice(0, headlength), headbit)

    return {
        type: _decode(head.slice(2, 5) as Head),
        data: new Uint8Array(stream.slice(headlength))
    }

}

import type { bit } from 'baseutil/bindata.ts'
export type { Source, Target, reqtypes, Head, Config, Server }
export { types, headbit }

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

interface Source<Data> {
    type: types
    data: Data
}

interface Target<T extends types> {
    type: T
    data: Uint8Array
}

type reqtypes = types.init_req | types.heartbeat_req

type Head = [number, number, number]

interface Config {
    room: number
    usekey: boolean
    client: string
}

interface Server {
    server: string
    token?: string
}


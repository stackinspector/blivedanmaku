import type { bit } from 'baseutil/bindata.ts'
export type { Source, Target, Event, Head, Config, Server }
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

interface Event<Data> {
    type: 'up' | 'down' | 'formated'
    time: number
    data: Source<Data>
}

type Head = [number, number, number]

interface Config {
    room: number
    usekey: boolean
    client: string
    filename: string
    log: boolean
}

interface Server {
    server: string
    token?: string
}


import { encode as encodeText, decode as decodeText } from 'std/encoding/utf8.ts'
import { types } from './codec.ts'
import type { Dict } from 'baseutil/fetchlot.ts'
export type { Config }
export { bootstraper, init, heartbeat }

interface Config {
    room: number
    usekey: boolean
    client: string
}

interface Server {
    server: string
    token?: string
}

// const getRandom = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]
const random = (count: number) => Math.floor(Math.random() * count)

const bootstraper = async (config: Config): Promise<Server> => {
    const info = (await (await fetch(
        `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${config.room}&type=0`
    )).json()).data as Dict
    return {
        server: `wss://${(info.host_list as Dict[])[config.usekey ? random(2) : 2].host as string}/sub`,
        token: config.usekey ? info.token as string : void 0
    }
}

const init = (config: Config, server: Server): [types.init_req, Uint8Array] => [types.init_req, encodeText(JSON.stringify({
    uid: 0,
    roomid: config.room,
    protover: 2,
    platform: 'web',
    clientver: config.client,
    type: 2,
    key: server.token
}))]

const heartbeat = (): [types.heartbeat_req, Uint8Array] => [types.heartbeat_req, encodeText({}.toString())]


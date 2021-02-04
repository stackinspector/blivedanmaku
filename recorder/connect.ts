import { randInt } from 'baseutil/random.ts'
import type { Dict } from 'baseutil/fetchlot.ts'
import type { Source, Config, Server } from './schema.ts'
import { PackageType } from './schema.ts'
export { getConfig, getServer, init, heartbeat }

const getConfig = (args: string[]): Config => ({
    client: args[0],
    usekey: Boolean(Number(args[1])),
    log: Boolean(Number(args[2])),
    room: Number(args[3]),
    filename: args[4],
})

const getServer = async (config: Config): Promise<Server> => {
    const info = (await (await fetch(
        `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${config.room}&type=0`
    )).json()).data as Dict
    return {
        server: `wss://${(info.host_list as Dict[])[config.usekey ? randInt(2) : 2].host as string}/sub`,
        token: config.usekey ? info.token as string : void 0
    }
}

const init = (config: Config, server: Server): Source<Dict> => ({
    type: PackageType.InitRequest,
    data: {
        uid: 0,
        roomid: config.room,
        protover: 2,
        platform: 'web',
        clientver: config.client,
        type: 2,
        key: server.token
    }
})

const heartbeat = (): Source<string> => ({
    type: PackageType.HeartbeatRequest,
    data: {}.toString()
})


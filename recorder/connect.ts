import { randInt } from 'baseutil/random.ts'
import type { Dict } from 'baseutil/fetchlot.ts'
import type { Source, Config, Server } from './schema.ts'
import { PackageType } from './schema.ts'
export { getConfig, getServer, init, heartbeat }

const getConfig = (args: string[]): Config => ({
    usekey: Boolean(Number(args[0])),
    log: Boolean(Number(args[1])),
    room: Number(args[2]),
    filename: args[3],
})

const getServer = async (config: Config): Promise<Server> => {
    const info: {
        host_list: {
            host: string
        }[]
        token: string
    } = (await (await fetch(
        `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${config.room}&type=0`
    )).json()).data
    return {
        server: `wss://${info.host_list[config.usekey ? randInt(2) : 2].host}/sub`,
        token: config.usekey ? info.token : void 0
    }
}

const init = (config: Config, server: Server): Source<Dict> => ({
    type: PackageType.InitRequest,
    data: {
        uid: 0,
        roomid: config.room,
        protover: 2,
        platform: 'web',
        type: 2,
        key: server.token
    }
})

const heartbeat = (): Source<string> => ({
    type: PackageType.HeartbeatRequest,
    data: {}.toString()
})


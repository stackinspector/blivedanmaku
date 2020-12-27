import { writelnSync } from 'baseutil/writeln.ts'
import * as codec from './codec.ts'
import type { Config } from './connect.ts'
import * as connect from './connect.ts'

const production = 3
const filename = (type: string) => `./live_${production}_${type}`;
const config: Config = {
    client: Deno.args[0],
    usekey: Boolean(Number(Deno.args[1])),
    room: Number(Deno.args[2])
} as const
const server = await connect.bootstraper(config)

const wsConnect = new WebSocket(server.server)

wsConnect.binaryType = 'arraybuffer'

wsConnect.onopen = () => {

    wsConnect.send(codec.encode(...connect.init(config, server)))

    const encodedHeartbeat = codec.encode(...connect.heartbeat())
    wsConnect.send(encodedHeartbeat)
    setInterval(() => wsConnect.send(encodedHeartbeat), 30000)

}

wsConnect.onmessage = ({ data }) => {

    console.log(codec.decode(data as ArrayBuffer))

    // writelnSync(JSON.stringify(data as ArrayBuffer), filename('meta'))
    // writelnSync(JSON.stringify(data as ArrayBuffer), filename('out'))

}


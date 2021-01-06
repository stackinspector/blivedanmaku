import { writelnSync } from 'baseutil/writeln.ts'
import type { Source, Event } from './schema.ts'
import * as codec from './codec.ts'
import * as parser from './parser.ts'
import * as connect from './connect.ts'
export { dump }

const config = connect.getConfig(Deno.args)
const server = await connect.getServer(config)
const ws = new WebSocket(server.server)
ws.binaryType = 'arraybuffer'

const dump = <T>(data: Event<T>, tag: 'meta' | 'data' | 'debug') => {
    writelnSync(JSON.stringify(data), `${config.filename}_${tag}`)
    if (config.log) console.log(tag.toUpperCase(), Deno.inspect(data, { colors: true, depth: 5 }))
}

const up = (data: Source<unknown>) => {
    dump({ type: 'up', time: Number(new Date()), data }, 'meta')
    return codec.encode(parser.encode(data))
}

const down = (data: ArrayBuffer, time: number) => {
    dump({ type: 'down', time, data: parser.decode(codec.decode(data)) }, 'meta')
}

ws.onopen = () => {
    ws.send(up(connect.init(config, server)))
    const heartbeat = connect.heartbeat()
    setInterval(() => ws.send(up(heartbeat)), 30000)
}

ws.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
    down(ev.data, ev.timeStamp)
}


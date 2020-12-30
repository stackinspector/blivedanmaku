import { writelnSync } from 'baseutil/writeln.ts'
import type { Source } from './schema.ts'
import * as codec from './codec.ts'
import * as parser from './parser.ts'
import * as connect from './connect.ts'

const config = connect.getConfig(Deno.args)
const server = await connect.getServer(config)
const ws = new WebSocket(server.server)
ws.binaryType = 'arraybuffer'

const dump = (data: Source<unknown>, tag: 'meta' | 'data') => {
    writelnSync(JSON.stringify(data), `${config.filename}_${tag}`)
    console.log(tag.toUpperCase(), data)
}

const up = (data: Source<unknown>) => {
    ws.send(codec.encode(parser.encode(data)))
    dump(data, 'meta')
}

const down = (data: ArrayBuffer) => {
    dump(parser.decode(codec.decode(data)), 'meta')
}

ws.onopen = () => {
    up(connect.init(config, server))
    setInterval(() => up(connect.heartbeat()), 30000)
}

ws.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
    down(ev.data)
}


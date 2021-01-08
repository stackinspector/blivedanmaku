import * as connect from './connect.ts'
import { config, up, down, report } from './pre.ts'

const server = await connect.getServer(config)
// deno-lint-ignore prefer-const
let ws = new WebSocket(server.server)

const initws = (ws: WebSocket) => {
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => {
        ws.send(up(connect.init(config, server)))
        const heartbeat = connect.heartbeat()
        setInterval(() => ws.send(up(heartbeat)), 30000)
    }
    ws.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
        down(ev.data, ev.timeStamp)
    }
    ws.onerror = (ev: Event) => {
        report(ev)
    }
    ws.onclose = (ev: Event) => {
        report(ev)
        ws = new WebSocket(server.server)
        initws(ws)
    }
}

initws(ws)
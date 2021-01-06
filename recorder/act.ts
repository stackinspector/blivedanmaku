import * as connect from './connect.ts'
import { config, up, down } from './pre.ts'

const server = await connect.getServer(config)
const ws = new WebSocket(server.server)

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
}

initws(ws)
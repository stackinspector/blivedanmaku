import * as connect from './connect.ts'
import { config, up, down, report } from './pre.ts'

const server = await connect.getServer(config)
let ws = new WebSocket(server.server)
const initws = (thisws: WebSocket) => {
    thisws.binaryType = 'arraybuffer'
    thisws.onopen = () => {
        thisws.send(up(connect.init(config, server)))
        const heartbeat = connect.heartbeat()
        setInterval(() => thisws.send(up(heartbeat)), 30000)
    }
    thisws.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
        down(ev.data, ev.timeStamp)
    }
    thisws.onerror = (ev) => {
        report(ev)
    }
    thisws.onclose = (ev) => {
        report(ev)
        ws = new WebSocket(server.server)
        initws(ws)
    }
}

initws(ws)
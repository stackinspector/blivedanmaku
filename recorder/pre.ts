import { writelnSync } from 'baseutil/writeln.ts'
import type { Source, MyEvent } from './schema.ts'
import * as codec from './codec.ts'
import * as parser from './parser.ts'
import { getConfig } from './connect.ts'
export { config, dump, up, down, report }

const config = getConfig(Deno.args)

const dump = <T>(data: MyEvent<T>, tag: 'meta' | 'data' | 'debug' | 'error' | 'crash') => {
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

const report = (ev: Event) => {
    dump({ type: 'crash', time: ev.timeStamp, data: Deno.inspect(ev, { depth: Infinity }) }, 'crash')
}


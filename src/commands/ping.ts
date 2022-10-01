import { decodeTime } from "ulid";
import { Command } from "..";

export default {
    name: 'ping',
    aliases: ['pong'],
    async run(message, _args, _db) {
        const msg = await message.reply('Ping? ...');
        await msg?.edit({ content: `Pong! ${decodeTime(msg._id) - decodeTime(message._id)}ms` });
    },
} as Command;

import { Result } from "surrealdb.js";
import { Command, CommandPrivilege } from "..";
import { DbFeed } from "../types/DbFeed";

export default {
    name: 'list',
    aliases: ['ls'],
    privilege: CommandPrivilege.Manager,
    async run(message, _args, db) {
        const [res] = await db.query<Result<DbFeed[]>[]>('SELECT * FROM feeds WHERE (channel == $channel);', {
            channel: message.channel_id
        });

        if (res.error) throw res.error;

        if (!res.result.length) await message.reply(`There are no RSS feeds subscribed to this channel yet.`)
        else await message.reply(
            `### RSS Feeds in this channel\n` +
            res.result
                .map(r => `\`${r.feedId}\` => ${r.url} ${r.errorCount ? `(${r.errorCount} error${r.errorCount == 1 ? '' : 's'})` : ''}\n`)
                .join('') +
            `###### Use the 26-character ID to delete feeds with '@${message.client.user?.username} delete'`
        );
    },
} as Command;

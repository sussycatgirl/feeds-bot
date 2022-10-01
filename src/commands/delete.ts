import { Result } from "surrealdb.js";
import { Command, CommandPrivilege } from "..";
import { DbFeed } from "../types/DbFeed";
import { yesNoMessage } from "../util";

export default {
    name: 'delete',
    aliases: ['rm', 'del'],
    privilege: CommandPrivilege.Manager,
    async run(message, args, db) {
        if (!message.channel?.havePermission('SendEmbeds'))
            return await message.reply(`I need "Send Embeds" permission to post in this channel.`);
        if (!message.channel?.havePermission('React'))
            return await message.reply(`I need "React" permission to post in this channel.`);

        if (!args[0]) return await message.reply('Please provide the ID of the feed you wish to delete.');

        const [res] = await db.query<Result<DbFeed[]>[]>('SELECT * FROM feeds WHERE (channel == $channel);', {
            channel: message.channel_id
        });

        if (res.error) throw res.error;

        let targetFeed = args[0].length == 26
            ? res.result?.find(f => f.feedId == args[0].toUpperCase())
            : res.result?.find(f => f.feedId.startsWith(args[0].toUpperCase()));

        if (!targetFeed) return await message.reply('A feed with this ID doesn\'t seem to exist in this channel.');

        const confirmed = await yesNoMessage(
            message.channel!,
            message.author_id,
            'Are you sure you want to delete this feed?',
            targetFeed.url,
            'Feed deleted!',
        )
        if (confirmed) {
            await db.delete(`feeds:${targetFeed.feedId}`);
        }
    }
} as Command;

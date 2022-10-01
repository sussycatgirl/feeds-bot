import Parser from "rss-parser";
import Surreal from "surrealdb.js";
import { ulid } from "ulid";
import { Command, CommandPrivilege, logger } from "..";
import { DbFeed } from "../types/DbFeed";
import { yesNoMessage } from "../util";

const MAX_FEEDS_PER_CHANNEL = 5;

const countFeeds = async (channel: string, db: Surreal): Promise<number> => {
    const [feedCountRes] = await db.query('SELECT count() FROM feeds WHERE (channel == $channel) GROUP BY ALL;', {
        channel: channel
    });
    
    if (feedCountRes.error) throw feedCountRes.error;
    return (feedCountRes.result as any)[0]?.count || 0;
}

export default {
    name: 'add',
    aliases: ['create', 'subscribe'],
    privilege: CommandPrivilege.Manager,
    async run(message, args, db) {
        const url = args[0];
        if (!url) return await message.reply('You need to provide a URL to the RSS feed!');

        try {
            const feedCount = await countFeeds(message.channel_id, db);
            if (feedCount >= MAX_FEEDS_PER_CHANNEL)
                return message.reply(`This channel already has ${feedCount} subscriptions! Please delete some before adding more.`);

                // if (!message.channel?.havePermission('Masquerade'))
                // return await message.reply(`I need "Masquerade" permission to post in this channel.`);
                if (!message.channel?.havePermission('SendEmbeds'))
                    return await message.reply(`I need "Send Embeds" permission to post in this channel.`);
                if (!message.channel?.havePermission('React'))
                    return await message.reply(`I need "React" permission to post in this channel.`);

            const parser = new Parser();
            const feed = await parser.parseURL(url);

            const res = await yesNoMessage(
                message.channel!,
                message.author_id,
                'Are you sure you want to subscribe to this RSS feed?',
                feed.title,
                'Feed added!',
                'Not adding feed.',
            );

            if (res) {
                if (await countFeeds(message.channel_id, db) >= MAX_FEEDS_PER_CHANNEL)
                return message.reply(`This channel already has too many subscriptions! Please delete some before adding more.`);

                const feedId = ulid();
                await db.create(`feeds:${feedId}`, {
                    id: feedId,
                    channel: message.channel_id,
                    url: url,
                    knownGuids: feed.items.filter(item => item.guid).map(item => item.guid),
                } as DbFeed);
            }
        } catch(e) {
            logger.warn('Failed to parse RSS feed: ' + e);
            return await message.reply(`Woops, looks like the URL you provided doesn't point to a valid RSS feed!`);
        }
    },
} as Command;

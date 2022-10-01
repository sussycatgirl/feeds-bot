import { Client } from "revolt.js";
import Parser from "rss-parser";
import Surreal from "surrealdb.js";
import { logger } from ".";
import { DbFeed } from "./types/DbFeed";

export default async (db: Surreal, client: Client) => {
    logger.info('Fetching feeds');

    try {
        const feeds = await db.select<DbFeed>('feeds');
        const toFetch: string[] = [];
        const promises: Promise<Parser.Output<{[key: string]: any}>>[] = [];
        const feedData: Map<string, Parser.Output<{[key: string]: any}> | Error> = new Map();

        for (const feed of feeds) {
            if (feed.errorRetryAt && feed.errorRetryAt > Date.now()) continue;
            if (!client.channels.get(feed.channel)) continue;
            if (!toFetch.includes(feed.url)) toFetch.push(feed.url);
        }

        for (const url of toFetch) {
            const parser = new Parser({ timeout: 10000 });
            promises.push(parser.parseURL(url));
        }

        const p = await Promise.allSettled(promises);
        logger.done(`Fetched ${p.length} URLs!`);
        for (const i in p) {
            const res = p[i], url = toFetch[i];
            if (res.status == 'rejected') {
                logger.warn(`Feed '${url}' failed to fetch: ${res.reason}`);
                feedData.set(url, new Error(''+res.reason));
            }
            else if (res.status == 'fulfilled') {
                feedData.set(url, res.value);
            }
        }

        for (const feed of feeds) {
            const channel = client.channels.get(feed.channel);
            if (!channel
                || !channel.havePermission('SendMessage')
                || !channel.havePermission('SendEmbeds')) continue;

            try {
                const data = feedData.get(feed.url);
                if (!data) continue;

                if (data instanceof Error) {
                    const retryDelays = [5, 10, 30, 60, 180, 24*60];
                    const delay = retryDelays[feed.errorCount ?? 0] || retryDelays[retryDelays.length - 1];

                    if (delay) {
                        // Retry in X minutes
                        await db.query('UPDATE feeds SET errorCount = errorCount + 1, errorRetryAt = $retryAt WHERE (id == $id);', {
                            id: feed.feedId,
                            retryAt: Date.now() + (delay * 1000 * 60) - 10000,
                        });

                        await channel.sendMessage({
                            embeds: [{
                                colour: 'var(--error)',
                                title: feed.url,
                                description: `Failed to fetch feed: ${data.message}\n\nRetrying <t:${Math.floor((Date.now() + (delay * 1000 * 60)) / 1000)}:R>.`,
                                icon_url: 'https://materialdesignicons.com/api/download/45AA2B72-8538-41CB-BAD4-20C43E40D21C/FFFFFF/1/FFFFFF/0/48',
                            }],
                        });
                    }
                }
                else {
                    for (const item of data.items) {
                        if (!item.guid || feed.knownGuids?.includes(item.guid)) continue;
                        await channel.sendMessage({
                            embeds: [{
                                title: [data.title, item.title, item.creator].filter((i) => i).join(' • ').substring(0, 100),
                                icon_url: data.image?.url,
                                url: item.link,
                                description: `${(item.contentSnippet || item.summary || item.content)?.split('\n')?.[0] ?? ''}\n\n[Read more](${item.link})`
                                    .substring(0, 2000),
                                colour: 'var(--primary-background)',
                            }],
                        });

                        await db.query('UPDATE feeds SET knownGuids += $guid, errorCount = 0 WHERE (url == $url && channel == $channel);', {
                            url: feed.url,
                            channel: feed.channel,
                            guid: item.guid,
                        });
                    }
                }
            } catch(e) {
                logger.error(''+e);
            }
        }
    } catch(e) {
        logger.error('An error occurred while fetching feeds: ' + e);
    }
}

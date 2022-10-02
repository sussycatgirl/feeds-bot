import Parser from "rss-parser";

class FeedParser extends Parser<{}, { id?: string }> {
    constructor() {
        super({
            timeout: 10000,
            customFields: {
                item: ['id']
            },
        });
    }

    // This makes sure the parser works properly with reddit by assigning the `id` field to `guid` if `guid` is unset.
    // Overriding parseString also affects parseURL.
    async parseString(xml: string, callback?: ((err: Error, feed: Parser.Output<{ id?: string; }>) => void) | undefined): Promise<Parser.Output<{ id?: string; }>> {
        const res = await super.parseString(xml, callback);
        return { ...res, items: res.items.map(item => item.guid ? item : { ...item, guid: item.id }) };
    }
}

export default FeedParser;

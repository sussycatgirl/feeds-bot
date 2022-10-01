export type DbFeed = {
    feedId: string;
    url: string;
    channel: string;
    errorRetryAt?: number;
    errorCount?: number;
    knownGuids: string[];
}

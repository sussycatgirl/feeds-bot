export type DbFeed = {
    id: string;
    url: string;
    channel: string;
    errorRetryAt?: number;
    errorCount?: number;
    knownGuids: string[];
}

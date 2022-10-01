import Surreal from 'surrealdb.js';
import { Client } from "revolt.js";
import Log75, { LogLevel } from 'log75';
import { config } from "./config";

const logger = new ((Log75 as any).default)(LogLevel.Debug) as Log75;
const client = new Client({ });
const db = new Surreal(config.SURREAL.URL);

const now = Date.now();
Promise.all([
    client.loginBot(config.BOT_TOKEN).then(() => logger.done(`Bot logged in: ${client.user?.username}`)),
    db.signin({
        // Broken types
        DB: undefined as any,
        NS: undefined as any,
        SC: undefined as any,
        user: config.SURREAL.USER,
        pass: config.SURREAL.PASS,
    }).then(() => logger.done('Connected to database')),
])
.then(async () => {
    logger.info(`Ready in ${Date.now() - now}ms!`);
});

import Surreal from 'surrealdb.js';
import { Client, Message } from "revolt.js";
import Log75, { LogLevel } from 'log75';
import { config } from "./config";
import { isManager } from './util';
import STRINGS from './strings';
import fetchFeeds from './fetchFeeds';
import { setupProm } from './prometheus';

const logger = new ((Log75 as any).default)(LogLevel.Debug) as Log75;
const client = new Client({ });
const db = new Surreal(config.SURREAL.URL);

const metrics = setupProm(db);

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
    await db.use('feeds-bot', 'feeds-bot');
    logger.info(`Ready in ${Date.now() - now}ms!`);

    process.on('SIGINT', () => {
        process.stdin.resume();
        logger.info('Received shutdown signal, disconnecting client');
        client.websocket.disconnect();
        process.exit(0);
    });

    commands.push((await import('./commands/ping')).default);
    commands.push((await import('./commands/list')).default);
    commands.push((await import('./commands/add')).default);
    commands.push((await import('./commands/delete')).default);
    commands.push((await import('./commands/help')).default);

    logger.done(`Registered ${commands.length} commands`);

    setInterval(() => fetchFeeds(db, client), 1000 * 60);
    await fetchFeeds(db, client);
});

client.on('message', async (message) => {
    if (!client.user || !message.content || message.system?.type) return;
    if (!message.channel?.havePermission('SendMessage')) return;

    const RE_PREFIX_MENTION = new RegExp(`^ ?<@${client.user._id}> {0,2}`, 'g');
    const match = message.content.match(RE_PREFIX_MENTION);
    if (!match?.length) return;

    const [cmdName, ...args] = message.content.substring(match[0].length).split(/ +/g);

    if (!cmdName) {
        logger.info('Received empty mention, sending short help text');
        return await message.reply(`:wave: Hi there! Check out "@${client.user.username} help" to get started.`);
    }

    const command = commands
        .find(c => c.name == cmdName.toLowerCase() || c.aliases?.includes(cmdName.toLowerCase()));

    if (command) {
        logger.info(`Command => ${cmdName} ${args.join(' ')}`);
        metrics.commands.inc({ name: command.name });

        try {
            if (command.privilege == CommandPrivilege.Manager && !isManager(message)) {
                return await message.reply(STRINGS.REQUIRE_MANAGER);
            }

            await command.run(message, args, db);
        } catch(e) {
            logger.error(`Command execution for '${cmdName}' failed: ${e}`);
            await message.channel?.sendMessage(`Command failed\n\`\`\`js\n${e}\n\`\`\``)
                .catch(e => console.error(e));
        }
    }
    else {
        logger.info(`Ignoring invalid command ${cmdName}`);
    }
});

type Command = {
    name: string;
    aliases?: string[];
    privilege: CommandPrivilege;
    run: (message: Message, args: string[], db: Surreal) => Promise<any>;
}

enum CommandPrivilege {
    User,
    Manager,
}

const commands: Command[] = [];

export { Command, CommandPrivilege, logger }

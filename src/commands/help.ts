import { Command, CommandPrivilege } from "..";

export default {
    name: 'help',
    privilege: CommandPrivilege.User,
    async run(message, _args, _db) {
        const name = message.client.user?.username || 'Feeds';

        await message.reply(
            `### :wave: Hi there!\n` +
            `Feeds is a bot that allows you to receive [RSS Feeds](<https://en.wikipedia.org/wiki/RSS>) directly into your Revolt channels.\n\n` +
            `To get started, add a feed with "@${name} add <https://my-awesome-website.com/feed.xml>".\n` +
            `You can list all feeds in a channel with "@${name} list" and delete the ones you no longer want with "@${name} delete".\n\n` +
            `By the way: This bot has no prefix. All commands are executed by @mentioning me!`,
            false
        );
    },
} as Command;

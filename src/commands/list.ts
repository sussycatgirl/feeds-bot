import { Command, CommandPrivilege } from "..";

export default {
    name: 'list',
    aliases: ['ls'],
    privilege: CommandPrivilege.Manager,
    async run(message, _args, db) {
        const [res] = await db.query('SELECT * FROM feeds WHERE (channel == $channel);', {
            channel: message.channel_id
        });

        if (res.error) throw res.error;

        
    },
} as Command;

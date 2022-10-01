import { Channel, ClientboundNotification, Message } from "revolt.js";
import { logger } from ".";

const isManager = (message: Message) => !!message.member
    ?.hasPermission(message.channel!, "ManageChannel");

const yesNoMessage = (
        channel: Channel,
        allowedUser: string,
        message: string,
        title?: string,
        messageYes?: string,
        messageNo?: string,
    ): Promise<boolean> => new Promise(async (resolve, reject) => {
        const EMOJI_YES = '✅', EMOJI_NO = '❌';
        try {
            const msg = await channel.sendMessage({ 
                embeds: [{
                    colour: 'var(--status-streaming)',
                    title: title,
                    description: message,
                }],
                interactions: {
                    reactions: [ EMOJI_YES, EMOJI_NO ],
                    restrict_reactions: true,
                }
            });

            let destroyed = false;
            const cb = async (packet: ClientboundNotification) => {
                if (packet.type != 'MessageReact') return;
                if (packet.id != msg._id) return;
                if (packet.user_id != allowedUser) return;

                switch(packet.emoji_id) {
                    case EMOJI_YES:
                        channel.client.removeListener('packet', cb);
                        destroyed = true;
                        resolve(true);
                        msg.edit({
                            embeds: [{
                                colour: 'var(--success)',
                                title: title,
                                description: `${EMOJI_YES} ${messageYes ?? 'Confirmed!'}`,
                            }]
                        })
                        .catch(e => console.error(e));
                    break;

                    case EMOJI_NO:
                        channel.client.removeListener('packet', cb);
                        destroyed = true;
                        resolve(false);
                        msg.edit({
                            embeds: [{
                                colour: 'var(--error)',
                                title: title,
                                description: `${EMOJI_NO} ${messageNo ?? 'Cancelled.'}`,
                            }]
                        })
                        .catch(e => console.error(e));
                    break;

                    default: logger.warn('Received unexpected reaction: ' + packet.emoji_id);
                }
            }
            channel.client.on('packet', cb);

            setTimeout(() => {
                if (!destroyed) {
                    resolve(false);
                    channel.client.removeListener('packet', cb);
                    msg.edit({
                        embeds: [{
                            colour: 'var(--error)',
                            title: title,
                            description: `${EMOJI_NO} Timed out`,
                        }]
                    })
                    .catch(e => console.error(e));
                }
            }, 30000);
        } catch(e) { reject(e) }
    });

export { isManager, yesNoMessage }

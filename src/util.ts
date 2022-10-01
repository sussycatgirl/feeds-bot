import { Message } from "revolt.js";

const isManager = (message: Message) => !!message.member
    ?.hasPermission(message.channel!.server ?? message.channel!, "ManageServer");

export { isManager }

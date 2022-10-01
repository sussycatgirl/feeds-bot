import { config as dotenv } from "dotenv";
dotenv();

const _throw = (err: string) => {
    throw new Error(err);
}

export const config = {
    SURREAL: {
        URL: process.env.SURREAL_URL || 'http://127.0.0.1:8000/rpc',
        USER: process.env.SURREAL_USER || 'root',
        PASS: process.env.SURREAL_PASS,
    },
    BOT_TOKEN: process.env.BOT_TOKEN || _throw("$BOT_TOKEN not provided"),
}
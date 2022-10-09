# Feeds

Feeds is a simple Revolt bot that delivers RSS feeds to your text channels. You can invite it [here](https://app.revolt.chat/bot/01FWVYTRQJE8HD70YB510538CN).

Feeds are refreshed once per minute, and if a feed fails to fetch the bot will notify the user and exponentially increase the retry delay.

### Self-Hosting

Self-Hosting Feeds is super simple thanks to Docker. Clone this repository, copy `.env.example` to `.env` and fill in your bot token, then run `docker-compose up -d` in this directory.

### Contributing
If you wish to contribute to this project, you are welcome to do so! Please use pnpm (npm install -g pnpm) instead of npm if you plan on opening a pull request. Thank you! <3

### License
This project is licensed under the AGPL 3.0. For details check out [LICENSE](./LICENSE).

# Prerequisites
 - Install Nodejs (download and install from official website)
 - Having a Quicknode RPC url (get yours for free at https://www.quicknode.com/)
 
# Set up 
 - Create your `.env` file based on the `example.env` file and update this value:
    - ANCHOR_PROVIDER_URL: with your Quicknode RPC url,
    - BUY_EVERY: number of milliseconds before the end the bot should look to buy a key (to adjust based on how long the `getGameInfo` and `buyKey` takes) - default 10000 (10 seconds)
    - BOT_KEY: Private key exported from Phantom (optional, only if you didnt set `keys/id.json`, see below)
 - In the folder keys, create the `id.json` file with your bot private key inside, format example: [458, 589, 228, etc..] (optional, can be done automatically if you set BOT_KEY)
 - Install the node packages: `npm i`
 - Check your computer clock, since everything is based on time, if your clock is off (even by a second), you will miss out. Check here: https://time.is/

# To Run
 - Run the command: `ts-node src/main.ts`
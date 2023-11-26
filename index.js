require('dotenv').config();
const Discord = require('discord.js');
const { TOKEN } = process.env;
const fs = require('fs');
const { execSync } = require('child_process');

const approvalPrompts = fs.readFileSync('approvalPrompts.json').toJSON();
const replies = fs.readFileSync('replies.json').toJSON();

const client = new Discord.Client({
    intents: new Discord.IntentsBitField().add([
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.Guilds,
    ]),
});

client.on('ready', async () => {
    console.log(
        `Logged in as: ${client.user.tag} (id: ${client.user.id})`
    );

    if (fs.existsSync('./storage/restart_info.json')) {
        var restart_info = JSON.parse(
            fs.readFileSync('./storage/restart_info.json').toString()
        );
        if (
            restart_info.channel_id != undefined &&
            restart_info.msg_id != undefined
        ) {
            var restart_msg_channel = await client.channels.fetch(
                restart_info.channel_id
            );
            var restart_msg = await restart_msg_channel.messages.fetch(
                restart_info.msg_id
            );
            restart_msg.edit('Restarted!');
            fs.writeFileSync('./storage/restart_info.json', '{}');
        }
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    const message = msg.cleanContent.toLowerCase();

    if (message.match(/adam .*restart.*/gi) != null) {
        let bot_msg = await msg.reply('Restarting...');
        fs.writeFileSync(
            './restart_info.json',
            JSON.stringify({
                msg_id: bot_msg.id,
                channel_id: bot_msg.channel.id,
            })
        );
        execSync('pm2 restart adam', {
            windowsHide: true,
        });
    }

    if (
        approvalPrompts.filter((x) => message.match(x) != null).length > 0
    ) {
        msg.channel.send(
            replies[Math.floor(Math.random() * replies.length)]
        );
        return;
    }

    if (message == 'adam?') {
        msg.channel.send('yeah?');
    }
});

client.on('guildCreate', async (guild) => {
    var user = await client.users.fetch(ids.HEYITSTIBO);
    user.send(`Added to server \`${guild.name}\``);
});

console.log('Connecting...');
client.login(TOKEN);

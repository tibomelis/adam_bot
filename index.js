require('dotenv').config();
const Discord = require('discord.js');
const { TOKEN } = process.env;
const fs = require('fs');
const { execSync } = require('child_process');

var TiboMessageCounter = 0;

const approvalPrompts = JSON.parse(
    fs.readFileSync('approvalPrompts.json')
);
const replies = JSON.parse(fs.readFileSync('replies.json'));

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
    // dont do stuff when the bot sends a message
    if (msg.author.bot) return;

    // required ofcourse
    if (msg.cleanContent.includes('🗿')) msg.react('🗿');

    // just for easy access.
    const message = msg.cleanContent.toLowerCase();

    // manual count reset
    if (message.match(/.*adam.*reset.*count.*/gi) != null) {
        msg.reply({
            content: 'okay okay fine...',
            allowedMentions: { repliedUser: false },
        });
        TiboMessageCounter = 0;
    }

    // flooding counter/reset
    if (msg.author.id == '457897694426300418') {
        TiboMessageCounter++;
    } else {
        TiboMessageCounter = 0;
    }

    // flooding warning
    if (TiboMessageCounter == 10) {
        msg.channel.send("Tibo.. you're flooding chat again..");
    }
    // flooding update
    if (TiboMessageCounter > 10 && TiboMessageCounter % 2 == 0) {
        msg.channel.send(
            `Tibo. stop flooding. ||${TiboMessageCounter} messages.||`
        );
    }

    // restart bot
    if (message.match(/.*adam.*restart.*/gi) != null) {
        const update_msg = await msg.reply({
            content: 'Okay.',
            allowedMentions: { repliedUser: false },
        });

        try {
            execSync('pm2 restart adam', {
                windowsHide: true,
            });
        } catch (err) {
            update_msg.reply(
                'Uhm.. <@457897694426300418> i got a boo boo...'
            );
        }
        return;
    }

    // update bot
    if (message.match(/.*adam.*update.*/gi) != null) {
        const update_msg = await msg.reply({
            content: 'Okay.',
            allowedMentions: { repliedUser: false },
        });

        try {
            execSync('git pull origin main|npm i', {
                windowsHide: true,
            });
        } catch (err) {
            update_msg.reply(
                'Uhm.. <@457897694426300418> i got a boo boo...'
            );
        }
        return;
    }

    // approval trigger
    if (
        approvalPrompts.filter((x) => message.match(x) != null).length > 0
    ) {
        msg.reply({
            content: replies[Math.floor(Math.random() * replies.length)],
            allowedMentions: { repliedUser: false },
        });
        return;
    }

    // just to check if adam is online
    if (message.match(/.*adam.*online.*/gi)) {
        msg.reply({
            content: 'yeah?',
            allowedMentions: { repliedUser: false },
        });
    }
});

client.on('guildCreate', async (guild) => {
    var user = await client.users.fetch('457897694426300418');
    user.send(`Added to server \`${guild.name}\``);
});

console.log('Connecting...');
client.login(TOKEN);

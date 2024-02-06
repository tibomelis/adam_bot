require('dotenv').config();
const Discord = require('discord.js');
const { TOKEN } = process.env;
const fs = require('fs');
const { exec, execSync } = require('child_process');

/** @type {number} */
var TiboMessageCounter = 0;

/** @type {(string|RegExp)[]} */
const approvalPrompts = require('./approvalPrompts');

/** @type {(string)[]} */
const replies = require('./replies');

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

    if (fs.existsSync('./restart_info.json')) {
        var restart_info = JSON.parse(
            fs.readFileSync('./restart_info.json').toString()
        );
        if (
            restart_info.channel_id != undefined &&
            restart_info.msg_id != undefined
        ) {
            var restart_msg_channel = await client.channels.fetch(
                restart_info.channel_id
            );
            /** @type {Discord.Message} */
            var restart_msg = await restart_msg_channel.messages.fetch(
                restart_info.msg_id
            );

            restart_msg.edit({
                content: 'Restarted!',
                allowedMentions: { repliedUser: false },
            });

            fs.writeFileSync('./restart_info.json', '{}');
        }
    }
});

client.on('messageCreate', async (msg) => {
    // dont do stuff when the bot sends a message
    if (msg.author.bot) return;

    // just for easy access.
    const message = msg.cleanContent.toLowerCase();

    // required ofcourse
    if (message.includes('🗿')) msg.react('🗿');

    // requested by Joery
    if (message == 'adam?') {
        const adamemoji = client.emojis.cache.get('1170472107742875688');
        msg.reply({
            content: `${adamemoji}`,
            allowedMentions: { repliedUser: false },
        });
        return;
    }

    // test
    if (message.match(/.*adam.*test.*/gi) != null) {
        msg.reply({
            content: 'Okay:',
            allowedMentions: { repliedUser: false },
        });

        const update_this = await msg.channel.send(
            '`this message should get updated in 1 second`'
        );
        await sleep();
        update_this.edit('`did it work?`');
    }
    if (message.match(/.*adam.*reset.*channels.*/gi) != null) {
        fs.writeFileSync('./channels.json', '{}');
        msg.channel.send('ok');
    }
    // flooding warning
    var channelInfo = fs.existsSync('./channels.json')
        ? JSON.parse(fs.readFileSync('./channels.json').toString())
        : {};

    // if channel count is not null OR the message was sent by tibo
    if (!channelInfo[msg.channelId])
        channelInfo[msg.channelId] = {
            WarnTiboAboutFlooding: false,
            TiboMessages: 0,
            lastAdamGifTimestamp: Date.now(),
        };

    channelInfo[msg.channelId].TiboMessages =
        msg.author.id == '457897694426300418'
            ? channelInfo[msg.channelId].TiboMessages + 1
            : 0;

    if (
        Date.now() - channelInfo[msg.channelId].lastAdamGifTimestamp >
        1800000
    ) {
        if (Math.random() > 0.9) {
            msg.channel.send(
                'https://media.discordapp.net/attachments/1002256216224956538/1199445627986247730/ezgif.com-animated-gif-maker.gif'
            );
            channelInfo[msg.channelId].lastAdamGifTimestamp = Date.now();
        }
    }
    if (message.match(/.*adam.*reset.*count.*/gi) != null) {
        // manual count reset
        msg.reply({
            content: 'okay okay fine...',
            allowedMentions: { repliedUser: false },
        });
        channelInfo[msg.channelId] = 0;
    }

    if (message.match(/.*adam.*allow.*spam.*/gi) != null) {
        channelInfo[msg.channelId].WarnTiboAboutFlooding = false;
        msg.channel.send('ok');
    }
    if (message.match(/.*adam.*dont allow.*spam.*/gi) != null) {
        channelInfo[msg.channelId].WarnTiboAboutFlooding = true;
        msg.channel.send('ok');
    }

    if (channelInfo[msg.channelId] == 10) {
        msg.channel.send("Tibo.. you're flooding chat again..");
    }
    if (
        channelInfo[msg.channelId].WarnTiboAboutFlooding &&
        channelInfo[msg.channelId] > 10 &&
        channelInfo[msg.channelId] % 3 == 0
    ) {
        msg.channel.send(
            `Tibo. stop flooding. ||${channelInfo} messages.||`
        );
    }
    fs.writeFileSync('./channels.json', JSON.stringify(channelInfo));

    // restart bot
    if (message.match(/.*adam.*restart.*/gi) != null) {
        const update_msg = await msg.reply({
            content: 'Okay. Restarting...',
            allowedMentions: { repliedUser: false },
        });
        var channel_id = update_msg.channelId;
        var msg_id = update_msg.id;

        fs.writeFileSync(
            './restart_info.json',
            JSON.stringify({ channel_id, msg_id })
        );

        try {
            exec('pm2 restart adam', {
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
            content: 'Okay. Updating...',
            allowedMentions: { repliedUser: false },
        });

        exec(
            'git pull origin main|npm i',
            {
                windowsHide: true,
            },
            (err, syncMsg, stderr) => {
                var changed = true;

                if (err) {
                    update_msg.reply(
                        'Uhm.. <@457897694426300418> i got a boo boo...'
                    );

                    return;
                }

                if (syncMsg.includes('Already up to date.')) {
                    update_msg.edit(
                        'There were no changes.. But you can still restart with me if you want (adam restart)'
                    );
                    changed = false;
                }

                if (changed) {
                    const commitMessage = execSync(
                        'git log -1 --pretty=format:%B'
                    ).toString();
                    const commitAuthor = execSync(
                        'git log -1 --pretty=format:%an'
                    ).toString();

                    update_msg.edit({
                        content:
                            'Updated:\n```' +
                            syncMsg +
                            '``` \n ```' +
                            `${commitMessage.toString()} \n - ${commitAuthor.toString()}` +
                            '```',
                    });
                } else {
                    update_msg.edit({
                        content:
                            'Console output: \n ```' + syncMsg + '```',
                    });
                }
            }
        );

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

    if (message.match(/.*adam.*translate.*/gi)) {
        const translateThis = message.replace(
            /.*adam.*translate(\s)?/gi,
            ''
        );
        fetch(
            `https://translate.google.com/translate_tts?ie=UTF-8&q=${translateThis}&tl=en&total=1&idx=0&textlen=4&client=tw-ob&prev=input&ttsspeed=1`
        )
            .then((r) => r.blob())
            .then((x) => console.log(x));
    }
});

client.on('guildCreate', async (guild) => {
    var user = await client.users.fetch('457897694426300418');
    user.send(`Added to server \`${guild.name}\``);
});

async function sleep(t = 1) {
    return new Promise((res) => setTimeout(() => res(), t * 1000));
}

console.log('Connecting...');
client.login(TOKEN);

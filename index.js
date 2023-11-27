require('dotenv').config();
const Discord = require('discord.js');
const { TOKEN } = process.env;
const fs = require('fs');
const { exec } = require('child_process');

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

    // required ofcourse
    if (msg.cleanContent.includes('🗿')) msg.react('🗿');

    // just for easy access.
    const message = msg.cleanContent.toLowerCase();
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

        try {
            exec(
                'git pull origin main|npm i',
                {
                    windowsHide: true,
                },
                (err, syncMsg, stderr) => {
                    msg.channel.send('a');
                    
                    var changed = true;

                    if (err) {
                        update_msg.edit(
                            'Ran into an error when trying to update.'
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
                                `${commitMessage} \n - ${commitAuthor}` +
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

async function sleep(t = 1) {
    return new Promise((res) => setTimeout(() => res(), t * 1000));
}

console.log('Connecting...');
client.login(TOKEN);

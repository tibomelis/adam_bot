require('dotenv').config();
const Discord = require('discord.js');
const { TOKEN } = process.env;

const approvalPrompts = ['does adam', 'is adam', 'will adam'];

const replies = [
    'Yes.',
    'I approve.',
    'Sure.',

    'I guess.',
    'Kinda.',
    'Idk.',
    'Maybe.',

    'No.',
    'Nah.',
    'Hell no...',
];
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
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    const message = msg.cleanContent.toLowerCase();

    if (message.match(/adam .*restart.*/gi) != null) {
        let bot_msg = await msg.reply('Restarting...');
        fs.writeFileSync(
            './storage/restart_info.json',
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

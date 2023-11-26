require('dotenv').config();
const Discord = require('discord.js');
const { TOKEN } = process.env;

const approvalPrompts = [
    'does adam approve?',
    'does adam approve',

    'does adam approve tho?',
    'does adam approve tho',

    'idk if adam approves',

    'adam, do you approve?',
    'adam, do you approve',

    'adam do you approve?',
    'adam do you approve',

    'right adam?',
    'right adam',
];

const replies = [
    'Yes.',
    'I approve.',
    'Sure.',

    'I guess.',
    'Kinda.',
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

    if (
        approvalPrompts.filter((x) => msg.cleanContent.match(x) != null)
            .length > 0
    ) {
        msg.channel.send(
            replies[Math.floor(Math.random() * replies.length)]
        );
        return;
    }

    if (msg.cleanContent == 'adam?') {
        msg.channel.send('yeah?');
    }
});

client.on('guildCreate', async (guild) => {
    var user = await client.users.fetch(ids.HEYITSTIBO);
    user.send(`Added to server \`${guild.name}\``);
});

console.log('Connecting...');
client.login(TOKEN);

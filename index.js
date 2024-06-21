const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, REST, Routes, ChannelType } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.commands = new Collection();

const loadCommands = (dir) => {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			loadCommands(filePath); // Recursively load commands in subdirectories
		} else if (file.endsWith('.js')) {
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
};

const commandsPath = path.join(__dirname, 'commands');
loadCommands(commandsPath);

client.once('ready', async () => {
	console.log(`Ready! Logged in as ${client.user.tag}`);

	// Fetch the guild
	const guild = await client.guilds.fetch(guildId);
	// Fetch the voice channels
	const voiceChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice);

	// Register the command with voice channel choices
	const commands = client.commands.map(command => {
		if (command.data.name === 'teams') {
			voiceChannels.forEach(channel => {
				command.data.options[0].addChoices({ name: channel.name, value: channel.id });
			});
		}
		else if (command.data.name == "captain") {
			voiceChannels.forEach(channel => {
				command.data.options[0].addChoices({ name: channel.name, value: channel.id });
			});
		}
		return command.data.toJSON();
	});

	const rest = new REST({ version: '10' }).setToken(token);
	try {
		console.log('Started refreshing application (/) commands.');
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);
		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(`Error executing ${interaction.commandName}`);
		console.error(error);
	}
});

// Event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);

const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('teams')
		.setDescription('Split members in a voice channel into teams')
		.addStringOption(option =>
			option.setName('channel')
				.setDescription('The voice channel to get members from')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('teams')
				.setDescription('The number of teams to create')
				.setRequired(true)),
	async execute(interaction) {
		const channelId = interaction.options.getString('channel');
		const teamCount = interaction.options.getInteger('teams');
		const channel = interaction.guild.channels.cache.get(channelId);

		// Ensure the channel is a voice channel
		if (!channel || channel.type !== ChannelType.GuildVoice) {
			return interaction.reply({ content: 'Invalid channel selected.', ephemeral: true });
		}

		// Fetch members in the specified voice channel
		const members = channel.members;

		// Ensure there are members in the voice channel
		if (members.size === 0) {
			return interaction.reply({ content: 'No members found in the specified voice channel.', ephemeral: true });
		}

		// Ensure the team count is valid
		if (teamCount <= 0) {
			return interaction.reply({ content: 'The number of teams must be greater than zero.', ephemeral: true });
		}

		// Split members into teams
		const shuffledMembers = Array.from(members.values()).sort(() => Math.random() - 0.5);
		const teams = Array.from({ length: teamCount }, () => []);

		shuffledMembers.forEach((member, index) => {
			teams[index % teamCount].push(member);
		});

		// Create and send the embed
		const embed = new EmbedBuilder()
			.setTitle('Teams')
			.setDescription(`Members in ${channel.name} have been split into ${teamCount} teams`);

		teams.forEach((team, index) => {
			embed.addFields({ name: `Team ${index + 1}`, value: team.map(member => member.displayName).join('\n') || 'No members' });
		});

		await interaction.reply({ embeds: [embed] });
	},
};

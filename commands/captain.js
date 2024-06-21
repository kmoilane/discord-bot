const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('captain')
		.setDescription('Select captains from a voice channel')
		.addStringOption(option =>
			option.setName('channel')
				.setDescription('The voice channel to get members from')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('captains')
				.setDescription('The number of captains to choose')
				.setRequired(true)),
	async execute(interaction) {
		const channelId = interaction.options.getString('channel');
		const teamCount = interaction.options.getInteger('captains');
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
			return interaction.reply({ content: 'The number of captains must be greater than zero.', ephemeral: true });
		}

		// Ensure the number of teams does not exceed the number of members
		if (teamCount > members.size) {
			return interaction.reply({ content: 'The number of captains cannot exceed the number of members.', ephemeral: true });
		}

		// Select captains
		const shuffledMembers = Array.from(members.values()).sort(() => Math.random() - 0.5);
		const captains = shuffledMembers.slice(0, teamCount);

		// Create and send the embed
		const embed = new EmbedBuilder()
			.setTitle('Captains')
			.setDescription(`Selected captains from ${channel.name}`);

		captains.forEach((captain, index) => {
			embed.addFields({ name: `Team ${index + 1} Captain`, value: captain.displayName });
		});

		await interaction.reply({ embeds: [embed] });
	},
};

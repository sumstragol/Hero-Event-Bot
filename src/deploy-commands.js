const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { clientId, guildId, token, resetConfirmMsg } = require('./config.json');

const commands = [
	new SlashCommandBuilder()
		.setName('kk')
		.setDescription('Komendy do konkursu.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('herolist')
				.setDescription('Pokazuje listę herosów, którzy znajdują się obecnie w puli.')	
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('f')
				.setDescription('Dodaje punkty za znalezienie herosa.')
				.addStringOption(option =>
					option
						.setName('hero')	
						.setDescription('Nazwa herosa, który został znaleziony.')
						.setRequired(true)
				)			
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('table')
				.setDescription('Aktualne wyniki konkrusu klanowego.')
				.addUserOption(option => 
					option 
						.setName('user')
						.setDescription('Użytkownik - zostanie wyświetlona ilość punktów tego użytkownika.')	
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('stats')
				.setDescription('Statystyki dotyczące konkursu klanowego.')	
		),
	new SlashCommandBuilder()
		.setName('kka')
		.setDescription('Komendy do administrowania konkursem.')
		.addSubcommandGroup(group => 
			group
				.setName('hero')
				.setDescription('Dodawanie / usuwanie herosów z puli.')
				.addSubcommand(subcommand =>
					subcommand
						.setName('add')
						.setDescription('Dodaje herosa do puli.')
						.addStringOption(option =>
							option
								.setName('hero')
								.setDescription('Nazwa herosa, który ma zostać dodany do puli.')
								.setRequired(true)
						)	
						.addIntegerOption(option =>
							option
								.setName('points')	
								.setDescription('Ilość punktów za znalezienie tego herosa.')
								.setRequired(true)
						)
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('remove')
						.setDescription('Usuwa herosa z puli.')
						.addStringOption(option =>
							option
								.setName('hero')
								.setDescription('Nazwa herosa, który ma zostać usunięty z puli.')
								.setRequired(true)
						)	
					
				)
		)
		.addSubcommandGroup(group => 
			group
				.setName('points')
				.setDescription('Manipulacja przypisanych puntków.')
				.addSubcommand(subcommand => 
					subcommand
						.setName('list')
						.setDescription('Wyświetla tabelę z puntkami.')
						.addUserOption(option =>
							option
								.setName('user')
								.setDescription('Użytkownik - zostaną wyświetlone rekordy tego użytkownika')	
						)
				)
				.addSubcommand(subcommand =>
					subcommand
						.setName('remove')
						.setDescription('Usunie rekord o podanym id')
						.addIntegerOption(option =>
							option
								.setName('id')
								.setDescription('ID rekordu z tabeli punktów.')	
								.setRequired(true)
						)	
				)
		)
		.addSubcommand(subcommand => 
			subcommand
				.setName('reset')
				.setDescription('Usuwa wszystkie dane związane z konkrusem.')
				.addStringOption(option =>
					option
						.setName('confirm')
						.setDescription(`Wpisz "${resetConfirmMsg}", aby zatwierdzić usunięcie danych.`)
						.setRequired(true)
				)
		)
]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
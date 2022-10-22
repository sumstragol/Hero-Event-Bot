const { Client, GatewayIntentBits } = require('discord.js')
const { token } = require('./config.json')
// all command handlers
const { foundHeroCommandHandler } = require('./command-handlers/found-hero-command-h')
const { heroCommandsHandler } = require('./command-handlers/hero-commands-h')
const { resetCommandHandler } = require('./command-handlers/reset-command-h')
const { statsRequestCommandHandler } = require('./command-handlers/stats-request-command-h')
const { tableRequestCommandHandler } = require('./command-handlers/table-request-command-h')
const { pointsCommandsHandler } = require('./command-handlers/points-commands-h')
const { herolistCommandHandler } = require('./command-handlers/herolist-command-h')




const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.once('ready', () => {
	console.log('Bot launched.');
});
client.login(token);




// command handling
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return

	const { commandName } = interaction
	// bot interact only with a commands
	if (!(commandName === 'kk' || commandName === 'kka')) return

	// commands reserved for administrators
	if (commandName == 'kka') {
		const commandHandler = await prepareAdminCommandHandler(interaction)
		await commandHandler(interaction)
			.then(async response => {
				await interaction.reply(response)
			})
			.catch(async response => {
				await interaction.reply(response)
			})
	}

	// commands reserved for regular users
	if (commandName == 'kk') {
		const commandHandler = await prepareUserCommandHandler(interaction)
		await commandHandler(interaction)
			.then(async response => {
				await interaction.reply(response)
			})
			.catch(async response => {
				await interaction.reply(response)
			})
	}
});




// admin part
const adminCommandHandlersCallbacks = {
	hero: heroCommandsHandler,
	points: pointsCommandsHandler,
	reset: resetCommandHandler
}

function prepareAdminCommandHandler(interaction) {
	return new Promise(async resolve => {
		const subCG = interaction.options.getSubcommandGroup()
		if (subCG) {
			resolve(adminCommandHandlersCallbacks[subCG])
			return
		} 
		
		// simply subcommands
		const subC = interaction.options.getSubcommand()
		if (subC) {
			resolve(adminCommandHandlersCallbacks[subC])
			return
		}
	})
}



// regular user part
const userCommandHandlersCallbacks = {
	herolist: herolistCommandHandler,
	f: foundHeroCommandHandler,
	table: tableRequestCommandHandler,
	stats: statsRequestCommandHandler
}

function prepareUserCommandHandler(interaction) {
	return new Promise(async resolve => {
		const subCG = interaction.options.getSubcommandGroup()
		if (subCG) {
			resolve(userCommandHandlersCallbacks[subCG])
			return
		} 
		
		// simply subcommands
		const subC = interaction.options.getSubcommand()
		if (subC) {
			resolve(userCommandHandlersCallbacks[subC])
			return
		}
	})
}
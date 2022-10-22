const { openDb, fetchGuildMembers, getMemberNickname } = require('../utils') 
const { databaseFilePath, embedColor, embedMaxFieldCount } = require('../config.json')
const { EmbedBuilder } = require('discord.js')

function tableRequestCommand(interaction) {
	// if user specified some user then where option will be aplied
	// to sql query
	const user = interaction.options.getUser('user')

	return new Promise(async (resolve, reject) => {
		const failMsg = 'Nie udało się pobrać tabeli z wynikami.'
		let shouldQuit = false

		const db = await openDb(databaseFilePath)
			.catch(err => {
				console.error(err)
				reject(failMsg)
				shouldQuit = true
			})
		if (shouldQuit) return;

		// fetch rows form points table
		const tablePromise = new Promise((tResolve, tReject) => {
			let userStatementPart = ''
			if (user) {
				userStatementPart = `WHERE points.participantId = ${user.id} `
			}
			db.all(
				"SELECT points.participantId, SUM(heros.points) as sumPoints FROM points " +
				"JOIN heros ON heros.name=points.heroName " + 
				userStatementPart +
				"GROUP BY points.participantId " +
				"ORDER BY sumPoints DESC",
				[],
				function(err, rows) {
					if (err) {
						console.error(err)
						tReject(failMsg)
					}

					tResolve(rows)
				}
			)
		})
		let pointsTable	
		await tablePromise
			.then(rows => {
				pointsTable = rows;
			})
			.catch(err => {
				reject(err)
				shouldQuit = true		
			})
		if (shouldQuit) return;

		// to get nicknames
		const members = await fetchGuildMembers(interaction.guild)
			.catch(err => {
				console.error(err)
				reject(err)
				shouldQuit = true
			})
		if (shouldQuit) return

		const embedPromise = new Promise(async (eResolve, eReject) => {
			// this promise can return a few embedes at special case
			// - every embed will differ only in fiedls
			// - function provides a frame for each one
			const embedFrame = () => {
				return new EmbedBuilder()
					.setTitle('Tabela wyników')
					.setAuthor({ name: 'Konkurs'})
					.setDescription('Tabela wyników z aktualną ilością puntków każdego uczestnika.')
					.setColor(embedColor)
			}

			if (!pointsTable.length) {
				const embed = embedFrame()
					.addFields([{
						name: 'Brak wyników.',
						value: ':('
					}])
				eResolve()
				interaction.channel.send({ embeds: [embed]} )
				return
			}

			// discord embed can hold up to 25 fields
			// if more then 25 fields will be needed
			// split record into multiply embeds 
			const maxFieldCount = embedMaxFieldCount
			let totalFieldCount = 0
			const embedsCount = Math.ceil(pointsTable.length / maxFieldCount)
			for (let eC = 0; eC < embedsCount; eC++) {
				const currentEmbed = embedFrame()
				for (let i = totalFieldCount,
					 	currentEmbedFieldCount = 0;
					  	i < pointsTable.length;
						i++, currentEmbedFieldCount++) 
				{
					if (currentEmbedFieldCount == maxFieldCount) {
						totalFieldCount = i
						break
					}

					const pId = pointsTable[i].participantId
					const points = pointsTable[i].sumPoints

					// get nickname 
					const memberNickname = await getMemberNickname(members, pId)

					currentEmbed.addFields([{
						name: `${i + 1}. ${memberNickname}`,
						value: `Punkty: ${points}`
					}])	
				}

				interaction.channel.send({ embeds: [currentEmbed]} )
			}

			eResolve()
		})
		await embedPromise
			.then(() => {
				resolve('Pobieranie wyników skończone.')
			})
	})
}

module.exports.tableRequestCommandHandler = tableRequestCommand
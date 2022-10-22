const { openDb, fetchGuildMembers, getMemberNickname } = require('../utils') 
const { databaseFilePath, embedColor, embedMaxFieldCount } = require('../config.json')
const { EmbedBuilder } = require('discord.js')

function pointsCommands(interaction) {
	return new Promise(async (resolve, reject) => {
		const subC = interaction.options.getSubcommand()
		if (subC == 'list') {
			const user = interaction.options.getUser('user')

			const failMsg = 'Nie udało się pobrać listy wyników.'
			let shouldQuit = false;
			const db = await openDb(databaseFilePath)
				.catch(err => {
					console.error(err)
					shouldQuit = true;
				})
			if (shouldQuit) {
				reject(failMsg)
				return
			}
			
			// fetch rows from points table
			const tablePromise = new Promise(async (lResolve, lReject) => {
				// option could specify user - if specified fetch only records from that user
				let userStatementPart = ''
				if (user) {
					userStatementPart = `WHERE participantId = ${user.id} `
				}
				db.all(
					"SELECT * FROM points " +
					userStatementPart,
					[],
					function(err, rows) {
						if (err) {
							console.error(err)
							lReject(failMsg)
						}

						lResolve(rows)
					}
				)
			})
			let pointsTable
			await tablePromise
				.then(rows => {
					pointsTable = rows
				})
				.catch(err => {
					reject(err)
					shouldQuit = true
				})
			if (shouldQuit) return

			// members in order to map discordid to nickname
			const members = await fetchGuildMembers(interaction.guild)
			.catch(err => {
				console.error(err)
				reject(err)
				shouldQuit = true
			})
			if (shouldQuit) return

			// assembling embed 
			const embedPromise = new Promise(async (eResolve, eReject) => {
				const embedFrame = () => {
					return new EmbedBuilder()
						.setTitle('Tabela puntków')
						.setAuthor({ name: 'Konkurs'})
						.setDescription('Dokładna tabela z puntkami uczestników.')
						.setColor(embedColor)
				}

				if (!pointsTable.length) {
					const embed = embedFrame()
						.addFields([{
							name: 'Brak wyników.',
							value: ':('
						}])
					eResolve()
					interaction.channel.send( {embeds: [embed]} )
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

						const id = pointsTable[i].id
						const pId = pointsTable[i].participantId
						const heroName = pointsTable[i].heroName
						const date = pointsTable[i].date

						const memberNickname = await getMemberNickname(members, pId)

						currentEmbed.addFields([{
							name: `${memberNickname}`,
							value: `id: ${id},
									uzytkownik: ${memberNickname},
								 	heros: ${heroName},
									data znalezienia: ${date}.`
						}])	
					}

					interaction.channel.send({ embeds: [currentEmbed] })
				}

				eResolve()	
			})
			await embedPromise
				.then(() => {
					resolve('Pobieranie wyników skończone.')
				})

			reject(failMsg)
		}
		else if (subC == 'remove') {
			const recordId = interaction.options.getInteger('id')

			const failMsg = 'Nie udało się usunąć rekordu.'
			let shouldQuit = false;
			const db = await openDb(databaseFilePath)
				.catch(err => {
					console.error(err)
					shouldQuit = true;
				})
			if (shouldQuit) {
				reject(failMsg)
				return
			}

			// check if user specified valid id
			const validIdPromise = new Promise(async (vResolve, vReject) => {
				db.get(
					"SELECT heroName FROM points WHERE id = ?",
					[recordId],
					function(err, row) {
						if (err) {
							console.error(err)
							vReject(failMsg)
							return
						}

						if (row) {
							vResolve('Id istnieje w rekodzie.')
							return
						}

						vReject('Podano złe id rekordu.')
					}
				)
			})
			await validIdPromise
				.catch(msg => {
					reject(msg)
					shouldQuit = true
				})
			if (shouldQuit) return

			// remove record from table based on id
			const removePromise = new Promise(async (rResolve, rReject) => {
				db.run(
					"DELETE FROM points WHERE id = ?",
					[recordId],
					function(err) {
						if (err) {
							console.error(err)
							rReject(failMsg)
							return
						}

						rResolve('Udało się usunąć rekord.')
					}
				)
			})
			await removePromise
				.then(msg => {
					resolve(msg)
				})
				.catch(msg =>
					resolve(msg)	
				)
		}
	})
}

module.exports.pointsCommandsHandler = pointsCommands
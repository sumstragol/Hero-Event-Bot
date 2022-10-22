const { databaseFilePath, embedColor } = require('../config.json')
const { checkIfHeroExists, openDb } = require('../utils')
const { EmbedBuilder } = require('discord.js')

function heroCommands(interaction) {
	return new Promise(async (resolve, reject) => { 
		const subC = interaction.options.getSubcommand()
		if (subC === 'add') {
			const heroName = interaction.options.getString('hero')
			const heroPoints = interaction.options.getInteger('points')
			
			const successMsg = `Heros ${heroName} (${heroPoints} punkt) został dodany do puli.`
			const failMsg = "Nie udało się dodać herosa do puli."

			const db = await openDb(databaseFilePath)
				.catch(err => {
					console.err(err)
					reject(failMsg)	
				})

			let shouldQuit = false;
			let exists = checkIfHeroExists(db, heroName)
				await exists	
					.then(result => {
						reject(`Heros ${heroName} znajduje się już w puli.`)
						shouldQuit = true;
					})
					.catch(result => {})
			if (shouldQuit) return;

			// add hero to the table
			const addPromise = new Promise((aResolve, aReject) => {
				db.run(
					"INSERT INTO heros(name, points) VALUES(?, ?)",
					[heroName, heroPoints],
					function(err) {
						if (err) {
							console.log(err)
							aReject(true)
							return
						}
						
						aResolve(true)
					}
				)
			})
			await addPromise
				.catch(result => {
					reject(failMsg)
				})
			
			db.close()
			resolve(successMsg)
		}
		else if (subC === 'remove') {
			const heroName = interaction.options.getString('hero')

			const successMsg = `Heros ${heroName} został usunięty z puli.`
			const failMsg = `Heros ${heroName} nie został usunięty z puli.`

			const db = await openDb(databaseFilePath)
				.catch(err => {
					console.err(err)
					reject(failMsg)	
				})

			// check if given hero exists
			let shouldQuit = false;
			let exists = checkIfHeroExists(db, heroName)
				await exists	
					.catch(result => {
						reject(`Heros ${heroName} nie znajduje się w puli.`)
						shouldQuit = true;
					})
			if (shouldQuit) return;

			// remove from hero table
			const removePromise = new Promise((rResolve, rReject) => {
				db.run(
					"DELETE FROM heros WHERE name = ?",
					[heroName],
					function(err) {
						if (err) {
							console.log(err)
							rReject(true)
							return
						}
						
						rResolve(true)
					}
				)
			})
			await removePromise
				.catch(result => {
					reject(failMsg)
				})

			resolve(successMsg)
			db.close()
		}
	})
}

module.exports.heroCommandsHandler = heroCommands
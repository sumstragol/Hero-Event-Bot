const { databaseFilePath } = require('../config.json')
const { checkIfUserParticipant, checkIfHeroExists, addNewParticpant, openDb } = require('../utils')

function foundHeroCommand(interaction) {
	const heroName = interaction.options.getString('hero')
	const userId = interaction.user.id
	const failMsg = 'Dodawanie punktów nie powiodło się.'
	
	return new Promise(async (resolve, reject) => {
		const db = await openDb(databaseFilePath)
			.catch(err => {
				console.log(err)
				reject(failMsg)
			})
		
		// first check if user is added to participants
		// if not add him to the list
		let shouldQuit = false
		await checkIfUserParticipant(db, userId)
			.catch(async result => {
				await addNewParticpant(db, userId)
					.catch(result => {
						reject(result)
						shouldQuit = true
					})
			})
		if (shouldQuit) return

		// check if user specified valid hero
		await checkIfHeroExists(db, heroName)
			.catch(result => {
				reject('Heros, którego podałeś nie znajduje się w puli.')
				shouldQuit = true
			})
		if (shouldQuit) return

		const addPointsPromise = new Promise((aResolve, aReject) => {
			db.run(
				"INSERT INTO points(participantId, heroName, date)" +
				"values(?, ?, ?)",
				[userId, heroName, new Date().toISOString()],
				function (err) {
					if (err) {
						console.log(err)
						aReject(true)
					}

					aResolve(true)
				}
			)
		})
		await addPointsPromise
			.then(result => {
				resolve(`Punkty za znalezienie ${heroName} zostały dodane.`)
			})
			.catch(result => {
				reject('Nie udało się dodać puntków.')
			})
	})
}

module.exports.foundHeroCommandHandler = foundHeroCommand
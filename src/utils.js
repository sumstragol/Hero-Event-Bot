function openDb(databaseFilePath) {
	const sqlite3 = require('sqlite3').verbose()
	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(databaseFilePath, err => {
			if (!err) resolve(db)
			else reject(err.message)
		})
	})
}
 
function checkIfHeroExists(db, heroName) {
	return new Promise((eResolve, eReject) => {
		db.get(
			"SELECT id FROM heros WHERE name = ?",
			[heroName],
			function(err, row) {
				if (err) {
					console.error(err)
					eReject(true)
					return
				}

				if (row) {
					eResolve(true)
					return
				}

				eReject(true)
			}
		)
	})
}

function checkIfUserParticipant(db, discordId) {
	return new Promise((resolve, reject) => {
		db.get(
			"SELECT id FROM participants WHERE discordId =?",
			[discordId],
			(err, row) => {
				if (err) {
					console.log(err)
					reject(true)
				}

				if (row) {
					resolve(true)
				}

				reject(true)
			}
		)
	})
}

function addNewParticpant(db, discordId) {
	return new Promise(async (resolve, reject) => {
		await checkIfUserParticipant()
			.then(result => {
				reject('Użytkownik jest juz uczestnikiem konkursu.')
			})
			.catch(result => {
				db.run(
					"INSERT INTO participants(discordId) values(?)",
					[discordId],
					function(err) {
						if (err) {
							reject('Coś poszło nie tak podczas dodawania użytkownika do uczestników konkursu.')
						}
					}
				)
			})

			resolve('Użytkownik został dodany do uczestników konkursu.')
	})
}

function fetchGuildMembers(guild) {
	return new Promise(async (resolve, reject) => {
		await guild.members.fetch()
			.then(rows => {
				resolve(rows)
			})
			.catch(err => {
				console.error(err)
				reject('Nie udało się pobrać listy użytkowników serwera.')
			})
	})
}

function findMemberById(members, discordId) {
	return new Promise(async (resolve, reject) => {
		members.forEach(member => {
			if (member.user.id == discordId) {
				resolve(member)
			}
		})

		reject(`Nie udało się znaleźć użytkownika o id ${discordId}.`)
	})
}

function getMemberNickname(members, pId) {
	return new Promise(async (resolve) => {
		// get nickname from member object
		let shouldQuit = false
		const member = await findMemberById(members, pId)
			.catch(err => {
				resolve('Nieznany')
				shouldQuit = true
			}) 
		if (shouldQuit) return
		// if user didnt assing nickname at guild
		// use regular username
		let memberNickname = member.nickname ? member.nickname : null
		if (!memberNickname) {
			memberNickname = member.user.username
		}

		resolve(memberNickname)
	})
}

module.exports = {
    openDb, checkIfHeroExists, checkIfUserParticipant,
    addNewParticpant, fetchGuildMembers, findMemberById,
    getMemberNickname
}
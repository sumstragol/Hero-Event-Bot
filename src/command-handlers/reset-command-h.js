const { openDb } = require('../utils') 
const { databaseFilePath, resetConfirmMsg } = require('../config.json')

function resetCommand(interaction) {
	const confirmation = interaction.options.getString('confirm')

	return new Promise(async (resolve, reject) => {
		if (confirmation == resetConfirmMsg) {
			const failMsg = 'Nie udało się usunąć danych z konkursu.'
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

			const errCallback = function(err) {
				if (err) console.error(err)
				reject(failMsg)
			}
			
			db.run("DELETE FROM heros;", [], errCallback)
			db.run("DELETE FROM participants;", [], errCallback)
			db.run("DELETE FROM points;", [], errCallback)

			resolve('Dane zostały poprawnie usunięte.')
		}
		
		reject('Zatwierdź komendę w prawidłowy sposób.')
	})
}

module.exports.resetCommandHandler = resetCommand
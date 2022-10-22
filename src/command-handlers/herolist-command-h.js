const { databaseFilePath, embedColor } = require('../config.json')
const { openDb } = require('../utils')
const { EmbedBuilder } = require('discord.js')

function herolistCommand(interaction) {
    return new Promise(async (resolve, reject) => {
        const failMsg = 'Nie udało się pobrać listy herosów.'

        let shouldQuit = false
		const db = await openDb(databaseFilePath)
			.catch(err => {
				console.err(err)
				reject(failMsg)
                shouldQuit = true	
			})
		if (shouldQuit) return

        // get each hero
        const listPromise = new Promise((lResolve, lReject) => {
            db.all(
                "SELECT name, points FROM heros",
                [],
                (err, rows) => {
                    if (err) {
                        lReject(true)
                        return
                    }

                    lResolve(rows)
                }
            )
        })
        let herosArr
        await listPromise
            .then(rows => {
                herosArr = rows
            })
            .catch(result => {
                shouldQuit = true
                reject(failMsg)
            })
        if (shouldQuit) return

        // embed promise with hero list
        const embedPromise = new Promise(eResolve => {
            const embed = new EmbedBuilder()
                .setTitle('Herosi')
                .setAuthor({ name: "Konkurs" } )
                .setDescription('Lista herosów, którzy znajdują się w puli.')
                .setColor(embedColor)

            if (!herosArr.length) {
                embed.addFields([{
                    name: 'Obecnie w puli nie znajduję się żaden heros.',
                    value: ':('
                }])
            }

            for (let i = 0; i < herosArr.length; i++) {
                embed.addFields([{ 
                        name: `${i + 1}. ${herosArr[i].name}`,
                        value: `Wartość: ${herosArr[i].points} pkt.` 
                    }
                ])
            }

            eResolve(embed)
        })
        // finally resolve with embed list
		await embedPromise
            .then(herosEmbed => {
                resolve({
                    embeds: [herosEmbed]
                })
            })
    })
}

module.exports.herolistCommandHandler = herolistCommand
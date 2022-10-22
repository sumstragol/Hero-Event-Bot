const { openDb, fetchGuildMembers, getMemberNickname } = require('../utils') 
const { databaseFilePath, embedColor } = require('../config.json')
const { EmbedBuilder } = require('discord.js')

function statsRequestCommand(interaction) {
	return new Promise(async (resolve, reject) => {
		let shouldQuit = false
		const db = await openDb(databaseFilePath)
			.catch(err => {
				console.error(err)
				shouldQuit = true
			})
		if (shouldQuit) return

		// how many heros found in total
		const totalHerosPromise = new Promise(async (tResolve, tReject) => {
			db.get(
				"SELECT COUNT(ID) as thf FROM points",
				[],
				function(err, row) {
					if (err) {
						console.error(err)
						tReject(0)
					}

					tResolve(row.thf)
				}
			)
		})
		const thpResult = await totalHerosPromise
			.catch(() => {})	
		const thfMsg = `Liczba wszystkich znalezionych herosów: ${thpResult}.`
		
		// count for each hero
		const herosFoundCount = new Promise(async (hResolve, hReject) => {
			db.all(
				"SELECT heroName, COUNT(id) as cid FROM points " +
				"GROUP BY heroName " +
				"ORDER BY cid DESC",
				[],
				function(err, rows) {
					if (err) {
						console.error(err)
						hReject()
					}

					hResolve(rows)
				}
			)
		})
		const hfcList = await herosFoundCount	
			.catch(() => {})
	
		// most time found by (participant) - for each hero
		const mtfbPromise = new Promise(async (mResolve, mReject) => {
			db.all(
				"SELECT DISTINCT heroName, participantId, MAX(cid) as maxCid FROM (" +
				"	SELECT COUNT(id) as cid, participantId, heroName FROM points " +
				"	GROUP BY participantId, heroName " +
				"	ORDER BY cid DESC " +
				") " +
				"GROUP BY heroName",
				[],
				function(err, rows) {
				if (err) {
					console.error(err)
					mReject()
				}

				mResolve(rows)
			})
		})
		await mtfbPromise
			.then(rows => { mtfbList = rows })
			.catch(() => { })

		// create a message - merge results from two queries into corresponding heros
		const mergedLists = {}
		hfcList.forEach(row => {
			mergedLists[row.heroName] = {
				foundCount: row.cid
			}
		})
		mtfbList.forEach(row => {
			mergedLists[row.heroName]['participantId'] = row.participantId
			mergedLists[row.heroName]['maxCid'] = row.maxCid
		})
	
		const members = await fetchGuildMembers(interaction.guild)
			.catch(err => {
				console.log(err)
			})

		let herosFoundCountStatsMsg = []
		for (const heroName in mergedLists) {
			const totalFoundCount = mergedLists[heroName]['foundCount']
			const mtfbParticipant = mergedLists[heroName]['participantId']
			const nickname = await getMemberNickname(members, mtfbParticipant)
			const mtfbParticipantCount = mergedLists[heroName]['maxCid']
			// Heros {} zostal znaleziony {} razy. Gracz {} znalazl go az {} razy.
			herosFoundCountStatsMsg += 
				'Heros ' + heroName + ' został znaleziony ' +
				totalFoundCount + ' razy. Gracz ' + nickname +
				' znalazł go aż ' + mtfbParticipantCount + ' razy.\n'
		}

		const embedPromise = new Promise(async (eResolve, eReject) => {
			const embedFrame = () => {
				return new EmbedBuilder()
					.setTitle('Tabela statystyk')
					.setAuthor({ name: 'Konkurs'})
					.setDescription('Tabela statystyk dotyczących konkrusu.')
					.setColor(embedColor)
			}

			const embed = embedFrame()

			// no heros found yet
			if (!thpResult) {
				embed
					.addFields([{
						name: 'Brak wyników.',
						value: ':('
					}])

				eResolve({ embeds: [embed] })
				return
			}

			
			embed
				.addFields([
					{
						name: "Liczba herosów znalezionych ogółem:",
						value: thfMsg
					},
					{
						name: "Ile razy dany heros został znaleziony:",
						value: herosFoundCountStatsMsg
					}
				])
			
			eResolve({ embeds: [embed]} )
		})
		await embedPromise
			.then(message => {
				resolve(message)
			})
	})
}

module.exports.statsRequestCommandHandler = statsRequestCommand
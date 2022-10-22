const { databaseFilePath } = require('./config.json');
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database(databaseFilePath, err => {
	if (err) {
		return console.error(err.message)
	}
})

console.log("CREATING TABLES...")
// heros table
db.run(
    "CREATE TABLE if not exists heros(" +
        "id integer primary key autoincrement," +
        "name varchar(20)," +  
        "points integer" +
    ")"
)
console.log("HEROS TABLE CREATED,")

// users table
// users that used /kk f at least once
// aka participants
db.run(
    "CREATE TABLE if not exists participants(" +
        "id integer primary key autoincrement," +
        "discordId integer" +  
    ")"
)
console.log("PARTICIPANTS TABLE CREATED,")

// points table
db.run(
    "CREATE TABLE if not exists points(" +
        "id integer primary key autoincrement," +
        "participantId integer," +
        "heroName varchar(20)," +
        "date text" +
    ")"
)
console.log("POINTS TABLE CREATED,")
console.log("DONE.")
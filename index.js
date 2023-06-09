const fetch = require("node-fetch");
require("dotenv-flow").config();

const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 9925;
const domain = process.env.PORT ? "simonly.herokuapp.com" : "127.0.0.1:9925";
const redirectUrl = "http://" + domain + "/projects/JavKing/home.html";

app.use(express.json()); // turns all requests into json

// Enable CORS middleware
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

const guildMemberList = [];
const guildRooms = [];

app.listen(PORT, () => {
	console.log("alive on " + PORT);
});

app.post("/guild-member", async (req, res) => {
	// requires "/:id" after guild_member in path
	// var { id } = req.params;
	const { id, username, avatar, accessToken, tokenType, guildList } = req.body;

	if (guildMemberList.findIndex((member) => member.id === id) > -1) {
		res.redirect(redirectUrl);
	}

	var userGuildList = [],
		mutualGuilds = [];

	if (!mutualGuilds.length) {
		await fetch("https://discord.com/api/v10/users/@me/guilds", {
			method: "GET",
			headers: new fetch.Headers({
				Authorization: `${tokenType} ${accessToken}`,
				"Content-Type": "application/x-www-form-encoded",
			}),
		})
			.then((res) => res.json())
			.then((json) => {
				json.forEach((guild) => {
					userGuildList.push({
						id: guild.id,
						name: guild.name,
						icon: guild.icon,
					});
				});
			});
	}

	userGuildList.sort((a, b) => {
		return a.id - b.id;
	});

	var splitGuildList = guildList.split(",");
	var mutuals = new Set(splitGuildList);
	mutualGuilds.push(
		...userGuildList.filter((guild) => {
			return mutuals.has(guild.id);
		})
	);

	mutualGuilds.forEach((guild) => {
		let index = userGuildList.findIndex((g) => g.id === guild.id);
		userGuildList.splice(index, 1);
	});

	guildMemberList.push({
		id,
		data: {
			username,
			avatar,
			accessToken,
			tokenType,
			userGuildList,
			mutualGuilds,
		},
	});

	try {
		res.redirect(redirectUrl);
	} catch (e) {
		res.status(503);
	}
	// [
	//     {
	//       id: '547956499545325589',
	//       data: {
	//         access_token: '7GucdFP80bdtMEVKk1w1eBgdezXHBI',
	//         id: '547956499545325589',
	//         avatar: 'f6413062bdbc790c6c1b2019d7a6c801',
	//         token_type: 'Bearer',
	//         username: 'Nakano'
	//       }
	//     }
	// ]
});

app.get("/guild-member/:id", cors(), (req, res) => {
	// getPort();
	const { id } = req.params;
	if (!id) id = cookieList.find((cookie) => cookie.id === id).id;
	if (!id) {
		res.status(401).send({
			message: "No id provided",
		});
	}
	let guildMember = guildMemberList.find((member) => member.id === id);
	if (!guildMember) {
		res.status(503).send({
			message: "No guild member found!",
		});
	} else {
		res.send(guildMember);
	}
});

app.post("/voice-update", cors(), (req, res) => {
	const { id, voiceId, voiceName, botJoinable, botVoiceId, botVoiceName, botSpeakable } = req.body;

	id = id || undefined;

	voiceId = voiceId || undefined;
	voiceName = voiceName || undefined;

	botJoinable = typeof botJoinable === "boolean" ? botJoinable : false;
	botSpeakable = typeof botJoinable === "boolean" ? botJoinable : false;

	botVoiceId = botVoiceId || undefined;
	botVoiceName = botVoiceName || undefined;

	let guildMember = guildMemberList.find((member) => member.id === id);
	if (!guildMember && !isBot(id)) {
		res.status(503).send({
			message: "No guild member found!",
		});
	}

	if (voiceId || voiceName)
		guildMember.data.voice = {
			...guildMember.data.voice,
			userChannel: { voiceId, voiceName, botJoinable },
		};
	else guildMember.data.voice.userChannel = null;

	if (botVoiceId || botVoiceName)
		guildMember.data.voice = {
			...guildMember.data.voice,
			botChannel: { botVoiceId, botVoiceName, botSpeakable },
		};
	else guildMember.data.voice.botChannel = null;

	res.send(redacted(guildMember));
});

app.get("/voice-member/:id?/:voiceId?/:botVoiceId?", cors(), (req, res) => {
	const { id, voiceId, botVoiceId } = req.params;

	let guildMember = guildMemberList.find((member) => member.id === id);
	if (!guildMember && !isBot(id)) {
		res.status(503).send({
			message: "No guild member found!",
		});
	} else {
		res.send(guildMember);
	}
});

app.post("/player-update", cors(), (req, res) => {
	const { guildId, position, paused, repeat, track } = req.body;

	const guildRoom = {
		id: guildRooms.length + 1,
		guildId,
		data: {
			position,
			paused,
			repeat,
			track
		}
	};

	guildRooms.push(guildRoom);

	res.status(201).json(guildRoom);
})

app.get("/guild-member/:id/guilds", cors(), (req, res) => {
	const { id } = req.params;
	let guildMember = guildMemberList.find((member) => member.id === id);
	if (!guildMember) {
		res.status(503).send({
			message: "No guild member found!",
		});
	} else {
		res.send(guildMember);
	}
});

app.delete("/guild-member/remove/:id", cors(), (req, res) => {
	const { id } = req.params;
	let index = guildMemberList.findIndex((member) => member.id === id);
	if (index === -1) {
		res.status(503).send({
			message: "No guild member found!",
		});
	} else {
		guildMemberList.splice(index, 1);
		res.send({
			message: "Guild member with id:" + id + " deleted!",
		});
	}
});

function isBot(id = 0) {
	return id == "694655522237972510";
}

function redacted({ id, data: { username, mutualGuilds, voice: { userChannel, botChannel } } }) {
	return { id, data: { username, mutualGuilds, voice: { userChannel, botChannel } } };
}
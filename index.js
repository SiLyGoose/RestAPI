const fetch = require("node-fetch");
require("dotenv-flow").config();

const express = require("express");
const cors = require("cors");
const app = express();

// const dom = require("jsdom");

const PORT = process.env.PORT || 9925;
const domain = process.env.PORT ? "simonly.herokuapp.com" : "127.0.0.1:9925";
const redirectUrl = "http://" + domain + "/projects/JavKing/home.html";

app.use(express.json()); // turns all requests into json

// Enable CORS middleware
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
  	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, application/json');
  	next();
})
  
// app.use(cors());

// const cookieList = [];
const guildMemberList = [];
const cookieList = [];

app.listen(PORT, () => {
	console.log("alive on " + PORT);
});

// app.post('/guild_member/:id', (req, res) => {
//     const { id } = req.params;
//     const { logo } = req.body;
//     res.status(200);
// });

app.post("/guild-member", async (req, res) => {
	// requires "/:id" after guild_member in path
	// var { id } = req.params;
	var { id, username, avatar, accessToken, tokenType, guildList } = req.body;

	if (guildMemberList.findIndex((member) => member.id === id) > -1) {
		res.redirect(redirectUrl);
	}

	// var cookie = res.cookie("uid", id, { maxAge: 86400000 });
	// cookieList.push({
	//     cookie,
	//     id
	// });

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

	guildList = guildList.split(",");
	var mutuals = new Set(guildList);
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
		// fetch(redirectUrl)
		// 	.then((response) => {
		// 		return response.text();
		// 	})
		// 	.then((html) => {
		// 		var document = new dom.JSDOM(html);
		// 		if (cookieList.find((cookie) => cookie.id === id)) {
		// 			res.redirect(redirectUrl);
		// 		} else {
		// 			document.cookieJar.setCookie(createCookie("SID", id, 2), redirectUrl, { url: domain }).then((cookie) => {
		// 				console.log(cookie);
		// 				cookieList.push({
		// 					id,
		// 					cookie: cookie.toString(),
		// 				});
		// 				console.log(cookieList);
		// 				res.redirect(redirectUrl);
		// 			});
		// 		}
		// 	});

		// res.cookie("SID", id, { maxAge: 2 * 24 * 60 * 60 * 1000 });
		// console.log(res.getHeader("Set-Cookie"), res.getHeaders())
		res.redirect(redirectUrl);

		// [
		//   {
		//     id: '257214680823627777',
		//     cookie: 'SID=257214680823627777; Max-Age=172800; Path=/; Expires=Fri, 08 Jul 2022 08:00:46 GMT; HttpOnly'
		//   }
		// ]
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

// app.get("/guild-member", cors(), (req, res) => {
// 	console.log(req.cookies, req.signedCookies);
// });

app.get("/guild-member/:id", cors(), (req, res) => {
	// getPort();
	var { id } = req.params;
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
	var { id, voiceId, voiceName, botVoiceId, botVoiceName, botJoinable } = req.body;

	let guildMember = guildMemberList.find((member) => member.id === id);
	if (!guildMember) {
		res.status(503).send({
			message: "No guild member found!",
		});
	}

	guildMember.data.voice = { userChannel: { voiceId, voiceName, botJoinable }, botChannel: { botVoiceId, botVoiceName, botJoinable } };

	res.status(200);
});

app.get("/voice-member/:id?/:voiceId?/:botVoiceId?", cors(), (req, res) => {
	var { id, voiceId, botVoiceId } = req.params;

	let guildMember = guildMemberList.find((member) => member.id === id);
	if (!guildMember) {
		res.status(503).send({
			message: "No guild member found!",
		});
	} else {
		res.send(guildMember);
	}
});

app.get("/guild-member/:id/guilds", cors(), (req, res) => {
	var { id } = req.params;
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
	var { id } = req.params;
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

function createCookie(name, value, days) {
	var d = new Date();
	d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
	var expiresIn = "expires=" + d.toUTCString();
	return `${name}=${value}; ${expiresIn}`;
}

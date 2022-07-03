const fetch = require("node-fetch");

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 9925;

app.use(express.json()); // turns all requests into json
app.use(cors());

// const cookieList = [];
const guildMemberList = [];

app.listen(PORT, () => console.log(`alive on http://localhost:${PORT}`));

// app.post('/guild_member/:id', (req, res) => {
//     const { id } = req.params;
//     const { logo } = req.body;
//     res.status(200);
// });

app.post("/guild-member", async (req, res) => {
	// requires "/:id" after guild_member in path
	// var { id } = req.params;
	var { id, username, avatar, access_token, token_type, guild_list } = req.body;

    if (guildMemberList.findIndex(member => member.id === id) > -1) {
	    res.redirect("http://zenpai.herokuapp.com/projects/JavKing/home.html?id=" + id);
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
				Authorization: `${token_type} ${access_token}`,
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

    userGuildList.sort((a, b) => { return a.id - b.id; })

    guild_list = guild_list.split(",");
	var mutuals = new Set(guild_list);
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
			access_token,
			token_type,
			user_guild_list: userGuildList,
			mutual_guilds: mutualGuilds,
		},
	});

    try {
        res.redirect("http://zenpai.herokuapp.com/projects/JavKing/home.html?id=" + id);
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

app.get("/guild-member", cors(), (req, res) => {
    // console.log(req.cookies, req.signedCookies);
})

app.get("/guild-member/:id", cors(), (req, res) => {
	var { id } = req.params;
	// console.log(id, req.body);
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
            message: "Guild member with id:" + id + " deleted!"
        });
	}
});

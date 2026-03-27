const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const imgurClientId = "fc9369e9aea767c";

module.exports = {
	config: {
		name: "rankup",
		version: "1.1.1",
		author: "VincentSensei",
		description: {
			vi: "Thông báo rankup cho từng nhóm",
			en: "Rankup notification for each group"
		},
		category: "system",
		usage: "rankup [on/off]",
		role: 0
	},

	langs: {
		vi: {
			on: "bật",
			off: "tắt",
			successText: "thành công thông báo rankup!",
			levelup: "★★ Chúc mừng {name} đã đạt level {level}",
			needImg: "Bạn cần cài đặt ảnh rankup trước! Dùng: setrankupimg <link>"
		},
		en: {
			on: "on",
			off: "off",
			successText: "success notification rankup!",
			levelup: "★★ Congratulations {name} on reaching level {level}!",
			needImg: "You need to set a rankup image first! Use: setrankupimg <link>"
		}
	},

	onStart: async function ({ api, event, threadsData, args, getLang }) {
		const { threadID, messageID } = event;

		// Show current status if no args
		if (!args[0]) {
			const rankupEnabled = await threadsData.get(threadID, "settings.rankupEnabled");
			const status = rankupEnabled ? "ON" : "OFF";
			return api.sendMessage(`📊 Rankup Status: ${status}\nUse: rankup [on/off]`, threadID, messageID);
		}

		if (args[0] === "on" || args[0] === "off") {
			const isOn = args[0] === "on";
			await threadsData.set(threadID, isOn, "settings.rankupEnabled");

			// Also set the message
			const defaultMsg = getLang("levelup");
			await threadsData.set(threadID, defaultMsg, "data.rankup.message");

			return api.sendMessage(`${isOn ? getLang("on") : getLang("off")} ${getLang("successText")}`, threadID, messageID);
		}

		return api.sendMessage(`Usage: rankup [on/off]`, threadID, messageID);
	},

	onChat: async function ({ api, event, usersData, threadsData, message, getLang }) {
		const { threadID, senderID } = event;

	        // Check if rankup is disabled for this thread (ON by default, no need to run !rankup on)
    const rankupEnabled = await threadsData.get(threadID, "settings.rankupEnabled");
    if (rankupEnabled === false) return; // only skip if admin explicitly turned it OFF

		// Calculate explicit EXP bounds if the core database is not auto-incrementing
		const userData = await usersData.get(senderID);
		const prevExp = userData?.exp || 0;
		const exp = prevExp + 1;

		// Set to GoatBot internal database (correct key notation - avoids overwriting all user data)
		await usersData.set(senderID, exp, "exp");

		// Calculate level before and after using the official GoatBot V2 curve
		const expToLevel = e => Math.floor((1 + Math.sqrt(1 + 8 * e / 5)) / 2);

		const prevLevel = expToLevel(prevExp);
		const currentLevel = expToLevel(exp);

		// Check if leveled up
		if (currentLevel > prevLevel && currentLevel > 1) {
			const name = await usersData.getName(senderID) || "User";

			// Get custom message or default
			let rankupMessage = await threadsData.get(threadID, "data.rankup.message");
			if (!rankupMessage) {
				rankupMessage = getLang("levelup");
			}

			rankupMessage = rankupMessage
				.replace(/{name}/g, name)
				.replace(/{level}/g, currentLevel)
				.replace(/{userName}/g, name);

			const form = { body: rankupMessage, mentions: [{ tag: name, id: senderID }] };

			try {
				const axios = require('axios');
				const imagePath = path.join(__dirname, '../cmds/', `rankup_${senderID}_${Date.now()}.gif`);
				const response = await axios({ method: 'get', url: `https://rankup-api-b1rv.vercel.app/api/rankup?uid=${senderID}`, responseType: 'stream' });
				const writer = fs.createWriteStream(imagePath);
				response.data.pipe(writer);
				await new Promise((resolve) => { writer.on('finish', resolve); });
				form.attachment = fs.createReadStream(imagePath);
				await message.send(form);
				fs.unlink(imagePath).catch(() => { });
			} catch (e) {
				console.error("[RANKUP] GIF error:", e.message);
				message.send(form);
			}
		}
	}
};

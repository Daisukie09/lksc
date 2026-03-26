const { log } = global.utils;

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
	// Register custom API extensions
	try {
		const path = require('path');
		const mqttClient = global.GoatBot.mqttClient || (global.client ? global.client.mqttClient : null) || (api.ctx ? api.ctx.mqttClient : null);
		const ctx_fca = global.GoatBot.ctx_fca || (global.client ? global.client.fca_ctx : null) || api.ctx;
		
		if (!mqttClient) log.warn("CUSTOM", "Could not find MQTT client for sendButtons injection");
		
		api.sendButtons = require("./extra/sendButtons.js")(api, mqttClient, ctx_fca);
		log.success("CUSTOM", "Injected portable api.sendButtons (Hybrid Method)");
	} catch (e) {
		log.warn("CUSTOM", "Could not inject portable api.sendButtons: " + e.message);
	}

	// This is where you can add your custom code to the bot.
	// The bot will run this code every time it starts up (after logging in and loading data from the database).

	setInterval(async () => {
		api.refreshFb_dtsg()
			.then(() => {
				log.succes("refreshFb_dtsg", getText("custom", "refreshedFb_dtsg"));
			})
			.catch((err) => {
				log.error("refreshFb_dtsg", getText("custom", "refreshedFb_dtsgError"), err);
			});
	}, 1000 * 60 * 60 * 48); // 48h
};

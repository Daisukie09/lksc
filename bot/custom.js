const { log } = global.utils;

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
	// Register custom API extensions
	const path = require('path');
	try {
		const sendButtons = require(path.join(process.cwd(), 'node_modules/goat-fca/src/apis/sendButtons.js'))(api.defaultFuncs, api, api.ctx);
		api.sendButtons = sendButtons;
		log.success("CUSTOM", "Natively injected api.sendButtons for high reliability");
	} catch (e) {
		log.warn("CUSTOM", "Could not natively inject api.sendButtons: " + e.message);
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

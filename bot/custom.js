const { log } = global.utils;

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
	// Register custom API extensions
	if (typeof api.addExternalModule === 'function') {
		try {
			api.addExternalModule({
				sendButtons: require('./extra/sendButtons')
			});
			log.info("CUSTOM API", "Successfully registered api.sendButtons");
		} catch (err) {
			log.error("CUSTOM API", "Failed to register api.sendButtons:", err);
		}
	} else {
		log.warn("CUSTOM API", "api.addExternalModule is not available. Cannot register sendButtons.");
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

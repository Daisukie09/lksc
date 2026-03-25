const { log } = global.utils;

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
	// Register custom API extensions
	if (typeof api.addExternalModule === 'function') {
		try {
			// Some FCA versions need the full path or require the module directly
			api.addExternalModule({
				sendButtons: require('./extra/sendButtons')
			});
			
			if (typeof api.sendButtons === 'function') {
				log.info("CUSTOM API", "Successfully registered api.sendButtons");
				// Also bind to global for easier access as a fallback
				global.sendButtons = api.sendButtons;
			} else {
				log.error("CUSTOM API", "Failed to bind sendButtons to api object.");
			}
		} catch (err) {
			log.error("CUSTOM API", "Error during api.addExternalModule:", err);
		}
	} else {
		log.warn("CUSTOM API", "api.addExternalModule is not available.");
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

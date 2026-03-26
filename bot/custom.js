const { log } = global.utils;

module.exports = async function ({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getText }) {
    // ———————————————————— CUSTOM SCRIPT ———————————————————— //
    try {
        if (!api.sendButtons) {
            const ctx_fca = api.ctx || global.GoatBot?.ctx_fca || global.client?.fca_ctx;
            if (ctx_fca) {
                console.log("[custom] Injecting sendButtons via custom.js using found context.");
                const sendButtonsFactory = require('./extra/sendButtons');
                api.sendButtons = sendButtonsFactory(null, api, ctx_fca);
            } else {
                console.warn("[custom] Could not find FCA context for sendButtons injection.");
            }
        }
    } catch (e) {
        console.error("[custom] Error injecting sendButtons:", e.message);
    }

	// This is where you can add your custom code to the bot.
	// The bot will run this code every time it starts up (after logging in and loading data from the database).

	setInterval(async () => {
		api.refreshFb_dtsg()
			.then(() => {
				log.success("refreshFb_dtsg", getText("custom", "refreshedFb_dtsg"));
			})
			.catch((err) => {
				log.error("refreshFb_dtsg", getText("custom", "refreshedFb_dtsgError"), err);
			});
	}, 1000 * 60 * 60 * 48); // 48h
};

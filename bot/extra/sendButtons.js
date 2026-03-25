"use strict";

const utils = require('../utils');

module.exports = function (defaultFuncs, api, ctx) {
    return function sendButtons(buttons, body, threadID, messageID, callback) {
        if (typeof buttons === 'string') {
            callback = messageID;
            messageID = threadID;
            threadID = body;
            body = buttons;
            buttons = [];
        }

        if (typeof messageID === 'function') {
            callback = messageID;
            messageID = null;
        }

        if (typeof threadID === 'function') {
            callback = threadID;
            threadID = null;
        }

        callback = callback || function () { };
        threadID = threadID || ctx.userID;

        const otrid = utils.generateOfflineThreadingID();

        const formatButtons = (btns) => {
            return btns.map(btn => {
                if (btn.cta_id) {
                    return {
                        action: {
                            cta_id: btn.cta_id,
                            type: 1
                        },
                        title: btn.title
                    };
                }
                return btn;
            });
        };

        const call_to_actions = JSON.stringify(formatButtons(buttons));

        const payload = {
            app_id: "2220391788200892",
            payload: JSON.stringify({
                tasks: [{
                    label: "46",
                    payload: JSON.stringify({
                        thread_id: threadID,
                        otrid: otrid,
                        source: 65537,
                        send_type: 1,
                        text: body,
                        reply_to_message_id: messageID,
                        initiating_source: 1,
                        call_to_actions: call_to_actions
                    }),
                    queue_name: threadID
                }],
                epoch_id: Date.now(),
                version_id: "6120284488008082"
            }),
            type: 3
        };

        if (ctx.mqttClient && ctx.mqttClient.connected) {
            ctx.mqttClient.publish('/ls_req', JSON.stringify(payload), { qos: 1, retain: false });
            callback(null, { otrid });
        } else {
            callback(new Error("MQTT client not connected"));
        }
    };
};

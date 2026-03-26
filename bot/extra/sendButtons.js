const SHUFFLE_SEED = 42;

function generateShufflePattern(length) {
    const pattern = Array.from({ length }, (_, i) => i);
    let seed = SHUFFLE_SEED;
    for (let i = length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
    }
    return pattern;
}

function generateReversePattern(shufflePattern) {
    const reversePattern = new Array(shufflePattern.length);
    for (let i = 0; i < shufflePattern.length; i++) {
        reversePattern[shufflePattern[i]] = i;
    }
    return reversePattern;
}

function unrearrange(rearrangedId) {
    try {
        if (!rearrangedId || typeof rearrangedId !== "string") return null;
        const pattern = generateShufflePattern(rearrangedId.length);
        const reversePattern = generateReversePattern(pattern);
        const original = new Array(rearrangedId.length);
        for (let i = 0; i < rearrangedId.length; i++) {
            original[reversePattern[i]] = rearrangedId[i];
        }
        return original.join("");
    } catch (err) {
        return null;
    }
}

function generateOfflineThreadingID() {
    var ret = Date.now();
    var value = Math.floor(Math.random() * 4294967295);
    var str = ("0000000000000000000000" + value.toString(2)).slice(-22);
    var msgs = ret.toString(2) + str;
    return parseInt(msgs, 2).toString();
}

function safeParseInt(value, fallback = 0) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
}

module.exports = function (api, mqttClient, ctx) {
    return function sendButtons(buttons, body, threadID, messageID, callback) {
        // Parameter normalization
        if (typeof buttons === 'string' && (body === undefined || typeof body === 'number' || typeof body === 'string')) {
            if (body === undefined || typeof body === 'number') {
                body = buttons;
                buttons = [];
            }
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
        threadID = threadID || api.getCurrentUserID();

        const otid = generateOfflineThreadingID();
        const isThreadMethod = typeof buttons === 'string' && buttons.length > 20; 
        const cta_id = isThreadMethod ? unrearrange(buttons) : null;

        const formatButtons = (btns) => {
            return (Array.isArray(btns) ? btns : []).map(btn => {
                if (btn.cta_id) {
                    return {
                        action: {
                            cta_id: btn.cta_id,
                            type: btn.cta_id.startsWith('http') ? 2 : 1
                        },
                        title: btn.title
                    };
                }
                return btn;
            });
        };

        const taskPayload = {
            thread_id: threadID,
            otid: safeParseInt(otid),
            source: 65544,
            send_type: isThreadMethod ? 5 : 1, 
            sync_group: 1,
            text: body || "",
            initiating_source: 1,
        };

        if (isThreadMethod) {
            taskPayload.forwarded_msg_id = cta_id;
            taskPayload.strip_forwarded_msg_caption = 1;
        } else {
            taskPayload.call_to_actions = JSON.stringify(formatButtons(buttons));
        }

        if (messageID) {
            taskPayload.reply_metadata = {
                reply_source_id: messageID,
                reply_source_type: 1,
                reply_type: 0,
            };
        }

        const payload = {
            app_id: "2220391788200892",
            payload: JSON.stringify({
                tasks: [{
                    label: "46",
                    payload: JSON.stringify(taskPayload),
                    queue_name: threadID
                }],
                epoch_id: safeParseInt(generateOfflineThreadingID()),
                version_id: "24180904141611263"
            }),
            type: 3
        };

        if (mqttClient && (mqttClient.connected || mqttClient._connected)) {
            console.log("[sendButtons] Publishing MQTT task 46 (Type:", isThreadMethod ? 5 : 1, ")");
            mqttClient.publish('/ls_req', JSON.stringify(payload), { qos: 1, retain: false });
            callback(null, { messageID: cta_id || otid });
        } else {
            const err = new Error("MQTT client not connected or not ready");
            console.error("[sendButtons] Error:", err.message);
            callback(err);
        }
    };
};

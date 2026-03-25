"use strict";

/**
 * sendButtons extension for goat-fca
 * Implements sending interactive buttons via MQTT
 */

const path = require('path');
const { generateOfflineThreadingID } = require(path.join(process.cwd(), 'node_modules/goat-fca/src/utils'));

function safeParseInt(value, fallback = 0) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? fallback : parsed;
}

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
    if (!rearrangedId || typeof rearrangedId !== 'string') return rearrangedId;
    const parts = rearrangedId.split(':');
    if (parts.length !== 2) return rearrangedId;

    const [header, content] = parts;
    const data = Buffer.from(content, 'base64');
    
    const shufflePattern = generateShufflePattern(data.length);
    const reversePattern = generateReversePattern(shufflePattern);
    
    const originalData = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      originalData[reversePattern[i]] = data[i];
    }
    
    return header + ':' + originalData.toString('utf-8');
  } catch (e) {
    return rearrangedId;
  }
}

module.exports = function (defaultFuncs, api, ctx) {
  return function sendButtons(buttons, body, threadID, messageID, callback) {
    let resolveFunc = function () { };
    let rejectFunc = function () { };
    const returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (typeof messageID == 'function') {
      callback = messageID;
      messageID = null;
    }

    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    try {
        const otrid = generateOfflineThreadingID();
        let call_to_actions = [];

        // Support both single cta_id string and array of button objects
        if (typeof buttons === "string") {
            const cleanCtaId = unrearrange(buttons);
            call_to_actions.push({
                action_id: cleanCtaId,
                cta_id: cleanCtaId,
                title: "View Details",
                type: 1
            });
        } else if (Array.isArray(buttons)) {
            call_to_actions = buttons.map(btn => {
                const cleanId = unrearrange(btn.cta_id || btn.action_id);
                return {
                    action_id: cleanId,
                    cta_id: cleanId,
                    title: btn.title || "View Details",
                    type: 1
                };
            });
        }

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
    } catch (err) {
        callback(err);
    }

    return returnPromise;
  };
};

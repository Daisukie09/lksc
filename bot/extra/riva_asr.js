"use strict";

const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

/**
 * Normalizes Messenger audio and transcribes it using NVIDIA Riva.
 * @param {string} audioURL - URL of the audio attachment
 * @param {string} threadID - Thread ID for file naming
 * @returns {Promise<string>} - Transcribed text
 */
module.exports = async function transcribeAudio(audioURL, threadID) {
    const tempDir = path.join(process.cwd(), "scripts/events/tmp");
    if (!fs.existsSync(tempDir)) fs.ensureDirSync(tempDir);

    const inputPath = path.join(tempDir, `asr_in_${threadID}_${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `asr_out_${threadID}_${Date.now()}.wav`);
    const pythonScript = path.join(process.cwd(), "bot/extra/riva_transcribe.py");

    try {
        // 1. Download audio attachment from Messenger
        const response = await axios({
            method: "get",
            url: audioURL,
            responseType: "stream"
        });
        const writer = fs.createWriteStream(inputPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // 2. Normalize to 16kHz Mono WAV using FFmpeg (Riva requirement)
        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -f wav "${outputPath}" -y`, (err) => {
                if (err) reject(new Error("FFmpeg failed. Ensure ffmpeg is installed: " + err.message));
                else resolve();
            });
        });

        // 3. Call Python transcription bridge (NIM / Riva gRPC)
        const transcript = await new Promise((resolve, reject) => {
            // Using "python" - ensure it matches user's environment (python3 might be needed)
            const pythonCmd = process.platform === "win32" ? "python" : "python3";
            exec(`${pythonCmd} "${pythonScript}" --input-file "${outputPath}"`, (err, stdout, stderr) => {
                if (err) reject(new Error("Riva ASR Error: " + stderr));
                else resolve(stdout.trim());
            });
        });

        // 4. Cleanup
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        return transcript;
    } catch (error) {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        throw error;
    }
};

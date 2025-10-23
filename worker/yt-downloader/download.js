import ytdlp from "yt-dlp-exec";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

const url = "https://www.youtube.com/watch?v=c-FKlE3_kHo";
const tempFile = "temp.m4a";
const outputFile = "audio.mp3";

try {
  console.log("🎧 Downloading best audio...");
  // Download best audio (usually M4A)
  await ytdlp(url, {
    output: tempFile,
    format: "bestaudio/best",
  });

  console.log("🎶 Converting to MP3...");
  ffmpeg(tempFile)
    .audioBitrate(192)
    .toFormat("mp3")
    .on("end", () => {
      console.log("✅ Conversion complete!");
      fs.unlinkSync(tempFile); // delete temp file
    })
    .on("error", (err) => console.error("❌ Error during conversion:", err))
    .save(outputFile);
} catch (err) {
  console.error("❌ Download failed:", err.message);
}

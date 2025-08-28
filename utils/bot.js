require("dotenv").config();
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { encryptValue, decryptValue } = require("./crypto");

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN missing in .env");

const bot = new Telegraf(BOT_TOKEN);

bot.command("start", (ctx) => {
  ctx.reply(`Welcome! ${ctx.from.first_name}`);
});

// --- Encrypt ---
bot.command("encrypt", async (ctx) => {
  try {
    const text = ctx.message.text.replace("/encrypt", "").trim();
    if (!text)
      return ctx.reply("Send something to encrypt, e.g., /encrypt hello");

    const encrypted = await encryptValue(text);

    // Send only base64 so /decrypt can read it
    await ctx.reply(encrypted);
  } catch (err) {
    console.error("Encryption error:", err);
    await ctx.reply(`❌ Failed: ${err.message}`);
  }
});

// --- Decrypt ---
bot.command("decrypt", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.text) {
      return ctx.reply("❌ Reply to an encrypted message to decrypt it.");
    }

    // Take the whole reply text as the encrypted string
    const encryptedText = reply.text.trim();

    const decrypted = await decryptValue(encryptedText);
    if (!decrypted) return ctx.reply("❌ Decryption failed");

    await ctx.reply(`Decrypted:\n${decrypted}`);
  } catch (err) {
    console.error("Decryption error:", err);
    await ctx.reply(`❌ Failed: ${err.message}`);
  }
});

bot.launch();
console.log("✅ Bot is running...");

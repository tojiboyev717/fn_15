require('./keep_alive'); // Keep-alive serverni ishga tushirish
const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

const botUsername = 'FN_Glass';
const botPassword = 'fort54321';
const admin = 'Umid';
var mcData;

const botOption = {
    host: 'hypixel.uz',
    port: 25565,
    username: botUsername,
    password: botPassword,
    version: '1.18.1',
};

init();

function init() {
    var bot = mineflayer.createBot(botOption);

    bot.on("messagestr", (message) => {
        if (message.includes("register")) {
            bot.chat(`/register ${botPassword} ${botPassword}`);
        }
        if (message.includes("login")) {
            bot.chat(`/login ${botPassword}`);
        }
    });

    bot.on("whisper", (username, message) => {
        if (username === admin && message === "quit") {
            bot.chat("Bot to‘xtatildi. 1 daqiqadan so‘ng qayta ulanadi.");
            bot.quit();
            setTimeout(() => {
                init();
            }, 60 * 1000);
        }
    });

    bot.on("spawn", () => {
        mcData = require("minecraft-data")(bot.version);

        setInterval(() => {
            bot.setControlState("jump", true);
            setTimeout(() => bot.setControlState("jump", false), 500);
        }, 3 * 60 * 1000);

        setTimeout(() => {
            bot.chat('/is warp afk');
        }, 1000);

        setTimeout(() => {
            buySand(bot);
        }, 5000);
    });

    bot.on("whisper", (usernameSender, message) => {
        if (usernameSender === admin && message.startsWith("! ")) {
            const command = message.replace("! ", "");
            bot.chat(command);
        }
    });

    async function buySand(bot) {
        bot.chat("/is shop Blocks");

        setTimeout(async () => {
            if (!bot.currentWindow) return;
            if (!bot.currentWindow.title.includes('Island Shop | Blocks')) return;

            let freeSlots = bot.inventory.emptySlotCount();
            let sandStackSize = 64;
            let maxSands = freeSlots * sandStackSize;

            if (maxSands === 0) {
                if (bot.currentWindow) await bot.closeWindow(bot.currentWindow);
                setTimeout(() => depositSand(bot), 3000);
                return;
            }

            const inventoryFullListener = async (username, message) => {
                if (message.includes("Your inventory is full!")) {
                    bot.removeListener("chat", inventoryFullListener);
                    if (bot.currentWindow) {
                        try {
                            await bot.closeWindow(bot.currentWindow);
                        } catch (e) {}
                    }
                    setTimeout(() => depositSand(bot), 3000);
                }
            };
            bot.on("chat", inventoryFullListener);

            for (let i = 0; i < maxSands; i++) {
                setTimeout(() => {
                    try {
                        if (bot.currentWindow) {
                            bot.simpleClick.leftMouse(30, 0, 0); // ❗ Slotni moslab qo‘ydim: slot 21 odatda coal
                        }
                    } catch (err) {}
                }, i * 100);
            }

            setTimeout(async () => {
                try {
                    if (bot.currentWindow) {
                        await bot.closeWindow(bot.currentWindow);
                    }
                } catch (err) {}
                setTimeout(() => depositSand(bot), 3000);
            }, maxSands * 100 + 1000);
        }, 3000);
    }

    async function depositSand(bot) {
        const p1 = new Vec3(5589, 97, -6197);  // Chesting joylashuvi
        let sands = bot.inventory.items().filter(item => item.name === 'sand');
        if (sands.length === 0) return;

        const chestBlock = await bot.blockAt(p1);
        if (!chestBlock || chestBlock.name !== 'chest') return;

        let chest;
        let attempts = 0;
        while (!chest && attempts < 3) {
            try {
                chest = await bot.openChest(chestBlock);
            } catch (error) {
                attempts++;
                await bot.waitForTicks(20);
            }
        }

        if (!chest) return;

        for (let i = 0; i < sands.length; i++) {
            const sand = sands[i];
            try {
                await chest.deposit(sand.type, null, sand.count);
            } catch (error) {}
        }

        await chest.close();

        setTimeout(() => {
            setTimeout(() => buySand(bot), 5000);
        }, 2000);
    }

    bot.on('end', () => {
        setTimeout(init, 5000);
    });
}

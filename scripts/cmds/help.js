const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "help",
		version: "2.4.74",
		role: 0,
		countDown: 0,
		author: "ST | Sheikh Tamim",
		description: "Displays all available commands and their categories.",
		category: "system"
	},

	ST: async ({ api, event, args }) => {
		const cmdsFolderPath = path.join(__dirname, '.');
		const files = fs.readdirSync(cmdsFolderPath).filter(f => f.endsWith('.js'));

		const send = async (msg, tid) => {
			try { return await api.sendMessage(msg, tid); } catch (e) { console.error(e); }
		};

		const getCategories = () => {
			const cats = {};
			for (const file of files) {
				try {
					const cmd = require(path.join(cmdsFolderPath, file));
					const cat = (cmd.config.category || 'uncategorized').toLowerCase();
					if (!cats[cat]) cats[cat] = [];
					cats[cat].push(cmd.config);
				} catch {}
			}
			return cats;
		};

		const catIcon = (name) => ({
			ai: '🤖', fun: '🎭', games: '🕹️', utility: '⚙️',
			admin: '🛡️', media: '📽️', music: '🎵', info: '📡',
			economy: '💸', social: '🌐', moderation: '⚖️',
			image: '🖼️', tool: '🔩', owner: '👑', config: '🔧',
			system: '💻', 'box chat': '💬', uncategorized: '📂'
		}[name.toLowerCase()] || '✦');

		try {
			const categories = getCategories();
			const catNames = Object.keys(categories).sort();
			const total = Object.values(categories).reduce((s, c) => s + c.length, 0);

			const arg = args[0];

			// ── !help <cmdname> ─────────────────────────────────────────────
			if (arg && isNaN(parseInt(arg))) {
				const target = arg.toLowerCase();
				const allCmds = files.map(f => {
					try { return require(path.join(cmdsFolderPath, f)); } catch { return null; }
				}).filter(Boolean);

				const found = allCmds.find(c =>
					c.config.name.toLowerCase() === target ||
					(c.config.aliases || []).includes(target)
				);

				if (found) {
					await send(buildCard(found.config), event.threadID);
				} else {
					await send(`✦ Command "${target}" not found.\n  Use !help to see all categories.`, event.threadID);
				}
				return;
			}

			// ── !help <number> → show that category ────────────────────────
			if (arg) {
				const num = parseInt(arg);
				if (num < 1 || num > catNames.length) {
					await send(`❌ Pick a number from 1 to ${catNames.length}.\n  Use !help to see the category list.`, event.threadID);
					return;
				}

				const cat = catNames[num - 1];
				const cmds = categories[cat].sort((a, b) => a.name.localeCompare(b.name));
				const icon = catIcon(cat);

				let msg = `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`;
				msg += `   ${icon}  ${cat.toUpperCase()}  COMMANDS\n`;
				msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

				cmds.forEach((cmd, i) => {
					const n = String(i + 1).padStart(2, '0');
					const desc = cmd.description
						? (typeof cmd.description === 'string' ? cmd.description : cmd.description.en || '')
						: '';
					const short = desc.length > 30 ? desc.substring(0, 30) + '…' : desc || '—';
					msg += ` ${n} ❯  !${cmd.name}\n`;
					msg += `  ╰┈┈ ${short}\n\n`;
				});

				msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
				msg += `  🔍 !help <cmd> for details\n`;
				msg += `  ↩️  !help to go back`;

				await send(msg, event.threadID);
				return;
			}

			// ── !help → main category menu ──────────────────────────────────
			let msg = `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`;
			msg += `    ✦  𝗞𝗨𝗥𝗨𝗠𝗜  𝗕𝗢𝗧  𝗠𝗘𝗡𝗨  ✦\n`;
			msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

			catNames.forEach((cat, i) => {
				const num = String(i + 1).padStart(2, '0');
				const icon = catIcon(cat);
				const count = categories[cat].length;
				msg += ` ${num} ❯  ${icon}  ${cat.toUpperCase()}\n`;
				msg += `  ╰┈┈ ${count} command${count > 1 ? 's' : ''}\n\n`;
			});

			msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			msg += `  ✦ Total   : ${total} Commands\n`;
			msg += `  ✦ Prefix  : !\n`;
			msg += `  ✦ Status  : Online 🟢\n`;
			msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			msg += `  📂 !help 1  !help 2  !help 3\n`;
			msg += `  🔍 !help <cmd> for details`;

			await send(msg, event.threadID);

		} catch (err) {
			console.error('Help error:', err);
			await send('⚠️ Failed to load help menu.', event.threadID);
		}
	}
};

// ── Command detail card ────────────────────────────────────────────────────
function buildCard(cfg) {
	const desc = cfg.description
		? (typeof cfg.description === 'string' ? cfg.description : cfg.description.en || 'No description')
		: 'No description';

	const guide = cfg.guide
		? (typeof cfg.guide === 'string' ? cfg.guide : cfg.guide.en || 'No guide')
		: 'No guide available';

	const roles = ['👤 User', '👮 Moderator', '🛡️ Admin', '👑 Owner'];
	const roleLabel = roles[cfg.role] || `Level ${cfg.role}`;

	let card = `╭━━━━━━━━━━━━━━━━━━━━━━━╮\n`;
	card += `   ✦  COMMAND  INFO\n`;
	card += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
	card += `  ⚡  !${cfg.name}\n\n`;
	card += `  📂  ${(cfg.category || 'uncategorized').toUpperCase()}\n`;
	card += `  🔐  ${roleLabel}\n`;
	card += `  👤  ${cfg.author || 'Unknown'}\n`;
	card += `  📝  v${cfg.version || 'N/A'}\n`;

	if (cfg.countDown)
		card += `  ⏱️  Cooldown : ${cfg.countDown}s\n`;

	if (cfg.aliases && cfg.aliases.length)
		card += `  🔄  Aliases  : ${cfg.aliases.join(', ')}\n`;

	card += `  💎  Premium  : ${cfg.premium ? 'Yes ✅' : 'No ❌'}\n`;

	if (cfg.unsend != null) {
		const u = typeof cfg.unsend === 'number' ? `${cfg.unsend}s` : cfg.unsend;
		card += `  🗑️  Auto-del : ${u}\n`;
	}

	card += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	card += `  📋  ${desc}\n`;
	card += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
	card += `  📚  Usage\n`;
	card += `  ╰┈┈ ${guide.replace(/{pn}/g, `!${cfg.name}`)}\n`;
	card += `━━━━━━━━━━━━━━━━━━━━━━━━━`;

	return card;
}

import { Client, IntentsBitField } from 'discord.js';

import { commands } from './commands';

const client = new Client({
	intents: [IntentsBitField.Flags.Guilds],
});

client.on('ready', async () => {
	await client.application?.commands.set(commands);

	console.log("I'm ready");
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const command = commands.find((c) => c.name === interaction.commandName);

		if (command) await command.callback(interaction);
	}
});

client.login('ODE2MDc4NTQxNTk3OTY2Mzg2.Gbzl0W.hfI2UzUK4ODM8oXgjE_2XPS0fiEvk85ya8T6Rc');

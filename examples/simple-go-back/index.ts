import { Client, IntentsBitField } from 'discord.js';

import { commands } from './commands';

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds],
});

client.application?.commands.set(commands);

// eslint-disable-next-line no-console
client.on('ready', () => console.log('I\'m ready'));

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    commands.forEach(async (command) => {
      if (command.name === interaction.commandName) {
        await command.callback(interaction);
      }
    });
  }
});

client.login('');

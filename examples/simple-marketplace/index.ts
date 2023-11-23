import {
  EmbedBuilder, User, Collection, Client, IntentsBitField,
} from 'discord.js';
import { createPostState, initialState, preCreatePostState } from './states';

import { Prompt } from '../../src';

export interface Post {
    id?: string;
    postType?: 'Hiring' | 'Hireable';
    paymentType?: 'Upon completion' | 'Per-task' | 'Upfront';
    title?: string;
    description?: string;
    portfolio?: string;
    pastWorks: [];
    targetChannelId?: string;
    paymentTypes: {
        USD?: number;
        Percentage?: number;
        Robux?: number;
    }
}

export interface MarketplacePostContext {
    selectedPost?: Post;
    previousState: string[];
}

export const posts = new Collection<string, Post>();

function formatPayment(paymentTypes: Post['paymentTypes']) {
  let output = '';

  if (paymentTypes.Robux) {
    output += `**Robux:** R$${paymentTypes.Robux}\n`;
  }

  if (paymentTypes.USD) {
    output += `**USD:** $${paymentTypes.USD}\n`;
  }

  if (paymentTypes.Percentage) {
    output += `**Percentage:** ${paymentTypes.Percentage}%\n`;
  }

  return output || 'Unspecified';
}

export function generatePostEmbed(post: Post, user: User) {
  const embed = new EmbedBuilder()
    .setTitle(post.title ?? '<No title>')
    .setDescription(post.description ?? '<No description>')
    .setFooter({ text: `Post ID: ${post.id}` })
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .addFields([
      { name: 'Payment', value: formatPayment(post.paymentTypes), inline: true },
      { name: 'Payment Type', value: post.paymentType ? post.paymentType : 'Unspecified', inline: true },
    ]);

  if (post.postType === 'Hireable') {
    embed.addFields([
      { name: 'Portfolio', value: post.portfolio ? `[Link](${post.portfolio})` : '*None*' },
      { name: 'Past Works', value: post.pastWorks.length ? post.pastWorks.map((c) => `[Link](${c})`).join(', ') : '*None provided*' },
    ]);
  }

  return embed;
}

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds],
});

// eslint-disable-next-line no-console
client.on('ready', () => console.log('I\'m ready'));

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'test') {
      const defaults: MarketplacePostContext = {
        previousState: [initialState.name],
        selectedPost: {
          pastWorks: [],
          paymentTypes: {},
        },
      };

      const prompt = new Prompt<MarketplacePostContext>(defaults, initialState.name, [
        initialState,
        preCreatePostState,
        createPostState,
      ]);

      await prompt.start(interaction);
    }
  }
});

client.login('');

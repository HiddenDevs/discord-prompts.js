import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { PromptComponentType, PromptState } from '../../../src';
import { MarketplacePostContext, posts } from '..';
import { preCreatePostState } from '.';

export const initialState: PromptState<MarketplacePostContext> = {
  timeout: 300_000,
  name: 'initial',
  message: () => ({
    ephemeral: true,
    embeds: [],
    components: [
      [
        {
          type: PromptComponentType.Button,
          component: () => new ButtonBuilder()
            .setLabel('Create new Post')
            .setStyle(ButtonStyle.Primary),
          callback: (ctx) => {
            ctx.previousState = [initialState.name];

            return preCreatePostState.name;
          },
        },
        {
          type: PromptComponentType.Button,
          component: () => new ButtonBuilder()
            .setLabel('Edit Post(s)')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(posts.size === 0),
          callback: (ctx) => {
            ctx.previousState = [initialState.name];

            // TODO: change
            return preCreatePostState.name;
          },
        },
      ],
    ],
  }),
};

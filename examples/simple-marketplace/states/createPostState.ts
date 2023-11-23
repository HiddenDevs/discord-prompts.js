import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { PromptComponentType, PromptState } from '../../../src';
import { MarketplacePostContext, generatePostEmbed } from '..';

export const createPostState: PromptState<MarketplacePostContext> = {
  name: 'createPost',
  timeout: 300,
  message: () => ({
    embeds: (ctx) => [generatePostEmbed(ctx.selectedPost!, ctx.interaction!.user)],
    ephemeral: true,
    components: [
      [
        {
          type: PromptComponentType.ModalButton,
          component: (ctx) => ({
            button: new ButtonBuilder()
              .setLabel(!ctx.selectedPost?.title || !ctx.selectedPost.description ? '* Edit post information' : 'Edit post information')
              .setStyle(!ctx.selectedPost?.title || !ctx.selectedPost.description ? ButtonStyle.Danger : ButtonStyle.Secondary),
            modal: new ModalBuilder()
              .setTitle('Edit Information')
              .addComponents([
                new ActionRowBuilder<TextInputBuilder>()
                  .addComponents([
                    new TextInputBuilder()
                      .setCustomId('title')
                      .setLabel('Title')
                      .setMaxLength(1024)
                      .setPlaceholder('Post title')
                      .setValue(ctx.selectedPost?.title ?? '')
                      .setRequired(true)
                      .setStyle(TextInputStyle.Paragraph),
                  ]),
                new ActionRowBuilder<TextInputBuilder>()
                  .addComponents([
                    new TextInputBuilder()
                      .setCustomId('body')
                      .setLabel('Body')
                      .setMaxLength(4000)
                      .setPlaceholder('Post body')
                      .setValue(ctx.selectedPost?.description ?? '')
                      .setRequired(true)
                      .setStyle(TextInputStyle.Paragraph),
                  ]),
              ]),
          }),
          callback: (ctx, interaction) => {
            const [title, description] = [interaction.fields.getTextInputValue('title'), interaction.fields.getTextInputValue('body')];

            ctx.selectedPost!.title = title;
            ctx.selectedPost!.description = description;

            return createPostState.name;
          },
        },
        {
          type: PromptComponentType.ModalButton,
          component: (ctx) => ({
            button: new ButtonBuilder()
              .setLabel(!Object.values(ctx.selectedPost!.paymentTypes).filter(Boolean).length ? '* Edit payment' : 'Edit payment')
              .setStyle(!Object.values(ctx.selectedPost!.paymentTypes).filter(Boolean).length ? ButtonStyle.Danger : ButtonStyle.Secondary),
            modal: new ModalBuilder()
              .setTitle('Edit Payment')
              .addComponents([
                new ActionRowBuilder<TextInputBuilder>()
                  .addComponents([
                    new TextInputBuilder()
                      .setCustomId('robux')
                      .setLabel('Robux')
                      .setMaxLength(100)
                      .setPlaceholder('Robux')
                      .setValue(ctx.selectedPost?.paymentTypes.Robux?.toString() ?? '')
                      .setRequired(false)
                      .setStyle(TextInputStyle.Short),
                  ]),
                new ActionRowBuilder<TextInputBuilder>()
                  .addComponents([
                    new TextInputBuilder()
                      .setCustomId('usd')
                      .setLabel('Real Money')
                      .setMaxLength(100)
                      .setPlaceholder('USD')
                      .setValue(ctx.selectedPost?.paymentTypes.USD?.toString() ?? '')
                      .setRequired(false)
                      .setStyle(TextInputStyle.Short),
                  ]),
                new ActionRowBuilder<TextInputBuilder>()
                  .addComponents([
                    new TextInputBuilder()
                      .setCustomId('percentage')
                      .setLabel('Percentage')
                      .setValue(ctx.selectedPost?.paymentTypes.Percentage?.toString() ?? '')
                      .setMaxLength(100)
                      .setPlaceholder('Percentage')
                      .setRequired(false)
                      .setStyle(TextInputStyle.Short),
                  ])]),
          }),
          callback: (ctx, interaction) => {
            const [robux, usd, percentage] = [interaction.fields.getTextInputValue('robux'), interaction.fields.getTextInputValue('usd'), interaction.fields.getTextInputValue('percentage')];

                            ctx.selectedPost!.paymentTypes = {
                              Percentage: Number(percentage) && Number(percentage) <= 100 ? Number(percentage) : undefined,
                              Robux: Number(robux) || undefined,
                              USD: Number(usd) || undefined,
                            };

                            return createPostState.name;
          },
        },
      ],
      [
        {
          type: PromptComponentType.SelectMenu,
          component: (ctx) => new StringSelectMenuBuilder()
            .setPlaceholder('* Select payment type')
            .addOptions([
              { label: 'Upon completion', value: 'Upon completion', default: ctx.selectedPost?.paymentType === 'Upon completion' },
              { label: 'Per-task', value: 'Per-task', default: ctx.selectedPost?.paymentType === 'Per-task' },
              { label: 'Upfront', value: 'Upfront', default: ctx.selectedPost?.paymentType === 'Upfront' },
            ]),
          callback: (ctx) => {
            ctx.selectedPost!.paymentType = ctx.interaction!.values[0] as any;

            return createPostState.name;
          },
        },
      ],
      [
        {
          type: PromptComponentType.Button,
          component: () => new ButtonBuilder()
            .setLabel('Go Back')
            .setStyle(ButtonStyle.Secondary),
          callback: (ctx) => ctx.previousState.pop()!,
        },
      ],
    ],
  }),
};

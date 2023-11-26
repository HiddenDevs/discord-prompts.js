import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { PromptComponentType, PromptState } from '../../../../../src';
import { PromptContext } from '../types/PromptContext';
import { fakeErrorState } from './fake-error-state';

export const initialState: PromptState<PromptContext> = {
	timeout: 300, // timeout in seconds
	name: 'initial',
	message: () => ({
		ephemeral: true,
		embeds: [],
		components: [
			[
				{
					type: PromptComponentType.ModalButton,
					component: (ctx) => ({
						button: new ButtonBuilder().setLabel('Answer Question').setStyle(ButtonStyle.Primary),
						modal: new ModalBuilder()
							.setTitle('Answer Question')
							.addComponents([
								new ActionRowBuilder<TextInputBuilder>().addComponents([
									new TextInputBuilder()
										.setCustomId('answer')
										.setLabel('Answer')
										.setMaxLength(1024)
										.setPlaceholder('Answer')
										.setValue(ctx.answer)
										.setRequired(true)
										.setStyle(TextInputStyle.Paragraph),
								]),
							]),
					}),
					callback: (ctx, interaction) => {
						const answer = interaction.fields.getTextInputValue('answer');
						ctx.answer = answer;

						return initialState.name;
					},
				},
				{
					type: PromptComponentType.Button,
					component: () => new ButtonBuilder().setLabel('Next').setStyle(ButtonStyle.Secondary),
					callback: () => fakeErrorState.name,
				},
			],
		],
	}),
};

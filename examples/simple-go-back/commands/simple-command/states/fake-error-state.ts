import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { PromptComponentType, PromptState } from '../../../../../src';
import { PromptContext } from '../types/PromptContext';

export const fakeErrorState: PromptState<PromptContext> = {
	name: 'fake-error',
	message: () => ({
		ephemeral: true,
		embeds: [],
		content: "This is a fake error state, it doesn't do anything. Just click go back.",
		components: [
			[
				{
					type: PromptComponentType.Button,
					component: () => new ButtonBuilder().setLabel('Go Back').setStyle(ButtonStyle.Secondary),
					callback: (ctx) => ctx.goBack(),
				},
			],
		],
	}),
};

import { ChatInputCommandInteraction } from 'discord.js';
import { Prompt } from '../../../../src';
import { fakeErrorState } from './states/fake-error-state';
import { initialState } from './states/initial-state';
import { PromptContext } from './types/PromptContext';

export const simpleCommand = {
	name: 'simple',
	description: 'A simple command',
	callback: async (interaction: ChatInputCommandInteraction) => {
		const defaults: PromptContext = {
			question: 'What is your favorite color?',
			answer: '',
		};

		const prompt = new Prompt<PromptContext>(defaults, initialState.name, [initialState, fakeErrorState]);

		await prompt.start(interaction);
	},
};

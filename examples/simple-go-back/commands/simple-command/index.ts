import { ChatInputCommandInteraction } from 'discord.js';
import { PromptContext } from './types/PromptContext';
import { Prompt } from '../../../../src';
import { initialState } from './states/initial-state';
import { fakeErrorState } from './states/fake-error-state';

export const simpleCommand = {
  name: 'simple',
  description: 'A simple command',
  callback: async (interaction: ChatInputCommandInteraction) => {
    const defaults: PromptContext = {
      question: 'What is your favorite color?',
      answer: '',
    };

    const prompt = new Prompt<PromptContext>(defaults, initialState.name, [
      initialState,
      fakeErrorState,
    ]);

    await prompt.start(interaction);
  },
};

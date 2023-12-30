import {
	ButtonBuilder,
	ButtonInteraction,
	EmbedBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	RepliableInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from 'discord.js';

import { MaybePromise } from './util.types';

// * Enums * //

/** An enum containing the prompt component types that are supported */
export const enum PromptComponentType {
	Button,
	ModalButton,
	SelectMenu,
	ModalSelectMenu,
}

// * Prompt Context Types * //

export type PromptContext<Context extends object, T = RepliableInteraction> = Context & {
	interaction?: T;
	previousStates: string[];
	goBack: () => string;
};

// * Prompt Component Types * //

interface ModalComponentReturnType<T, Interaction> {
	button: T;
	modal: ModalBuilder | ((interaction: Interaction) => MaybePromise<ModalBuilder | null>);
}

export interface PromptStateComponentBase<Context extends object, Interaction = RepliableInteraction> {
	callback: string | ((ctx: PromptContext<Context, Interaction>) => MaybePromise<string | undefined>);
}

export interface PromptStateComponentBaseWithInteraction<
	Context extends object,
	Interaction = RepliableInteraction,
	AlternateInteraction = Interaction,
> {
	callback:
		| string
		| ((
				ctx: PromptContext<Context, Interaction>,
				interaction: AlternateInteraction,
		  ) => MaybePromise<string | undefined>);
}

/** A prompt state that uses a button component */
export interface PromptStateButtonComponent<T extends object> extends PromptStateComponentBase<T, ButtonInteraction> {
	type: PromptComponentType.Button;
	component: ButtonBuilder | ((ctx: PromptContext<T>) => MaybePromise<ButtonBuilder>);
}

/** A prompt state that contains a select menu */
export interface PromptStateSelectMenuComponent<T extends object>
	extends PromptStateComponentBase<T, StringSelectMenuBuilder> {
	type: PromptComponentType.SelectMenu;
	component: StringSelectMenuBuilder | ((ctx: PromptContext<T>) => MaybePromise<StringSelectMenuBuilder>);
}

/** A prompt state that uses a modal that is opened by a button */
export interface PromptStateModalButtonComponent<T extends object>
	extends PromptStateComponentBaseWithInteraction<T, ButtonInteraction, ModalSubmitInteraction> {
	type: PromptComponentType.ModalButton;
	component:
		| ModalComponentReturnType<ButtonBuilder, ButtonInteraction>
		| ((ctx: PromptContext<T>) => MaybePromise<ModalComponentReturnType<ButtonBuilder, ButtonInteraction>>);
}

/** A prompt state that is a modal opened by a select menu component */
export interface PromptStateModalSelectMenuComponent<T extends object>
	extends PromptStateComponentBaseWithInteraction<T, StringSelectMenuInteraction, ModalSubmitInteraction | null> {
	type: PromptComponentType.ModalSelectMenu;
	component:
		| ModalComponentReturnType<StringSelectMenuBuilder, StringSelectMenuInteraction>
		| ((
				ctx: PromptContext<T>,
		  ) => MaybePromise<ModalComponentReturnType<StringSelectMenuBuilder, StringSelectMenuInteraction>>);
}

/** A type representing a prompt state component, used when defining the components added for a prompt state */
export type PromptStateComponent<T extends object> =
	| PromptStateButtonComponent<T>
	| PromptStateSelectMenuComponent<T>
	| PromptStateModalSelectMenuComponent<T>
	| PromptStateModalButtonComponent<T>;

// * Prompt State Types * //

/** A prompt state message callback */
export interface PromptStateMessageCallback<T extends object> {
	ephemeral: boolean;
	content?: string | ((ctx: PromptContext<T>) => MaybePromise<string | undefined>);
	embeds: EmbedBuilder[] | ((ctx: PromptContext<T>) => MaybePromise<EmbedBuilder[]>);
	components: PromptStateComponent<T>[][] | ((ctx: PromptContext<T>) => MaybePromise<PromptStateComponent<T>[][]>);
}

/**
 * A type representing a prompt state that is possible
 * @param T The type of the prompt context
 */
export interface PromptState<T extends object> {
	name: string;
	timeout?: number;
	onEntered?: (ctx: PromptContext<T>) => MaybePromise<string | undefined>;
	message: PromptStateMessageCallback<T> | ((ctx: PromptContext<T>) => MaybePromise<PromptStateMessageCallback<T>>);
}

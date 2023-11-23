import {
  ButtonBuilder, ButtonInteraction, EmbedBuilder, ModalBuilder, ModalSubmitInteraction, RepliableInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction,
} from 'discord.js';

import { MaybePromise } from './util.types';

// * Enums * //

/** An enum containing the prompt component types that are supported */
export const enum PromptComponentType {
    Button,
    ModalButton,
    SelectMenu,
    ModalSelectMenu
}

// * Prompt Context Types * //

interface PromptContextBase<T> {
    interaction?: T

    /** The previous states of the prompt */
    previousStates: string[];

    /**
     * Gets the previous state and pops it out of the stack
     * @returns The previous state, if no state is found it returns the initial state
     */
    goBack: () => string;
}

/** The type representative of the context */
export type PromptContext<T extends object, I = RepliableInteraction> = T extends PromptContextBase<I> ? T : PromptContextBase<I> & T;

// * Prompt Component Types * //

interface PromptStateComponentBase<Context extends object, Interaction = RepliableInteraction> {
    callback: string | ((ctx: PromptContext<Context, Interaction>) => MaybePromise<string | undefined>);
}

interface PromptStateComponentBaseWithInteraction<Context extends object, Interaction = RepliableInteraction, AlternateInteraction = Interaction> {
    callback: string | ((ctx: PromptContext<Context, Interaction>, interaction: AlternateInteraction) => MaybePromise<string | undefined>);
}

/** A prompt state that uses a button component */
export interface PromptStateButtonComponent<T extends object> extends PromptStateComponentBase<T, ButtonInteraction> {
    type: PromptComponentType.Button;
    component: ((ctx: PromptContext<T>) => MaybePromise<ButtonBuilder>);
}

/** A prompt state that contains a select menu */
export interface PromptStateSelectMenuComponent<T extends object> extends PromptStateComponentBase<T, StringSelectMenuInteraction> {
    type: PromptComponentType.SelectMenu;
    component: ((ctx: PromptContext<T>) => MaybePromise<StringSelectMenuBuilder>);
}

/** A prompt state that uses a modal that is opened by a button */
export interface PromptStateModalButtonComponent<T extends object> extends PromptStateComponentBaseWithInteraction<T, ButtonInteraction, ModalSubmitInteraction> {
    type: PromptComponentType.ModalButton;
    component: ((ctx: PromptContext<T>) => MaybePromise<{ button: ButtonBuilder; modal: ModalBuilder; }>);
}

/** A prompt state that is a modal opened by a select menu component */
export interface PromptStateModalSelectMenuComponent<T extends object, K extends boolean = boolean> extends PromptStateComponentBaseWithInteraction<T, StringSelectMenuInteraction, K extends true ? ModalSubmitInteraction : null> {
    type: PromptComponentType.ModalSelectMenu;
    showModal?: K | ((ctx: PromptContext<T, StringSelectMenuInteraction>) => MaybePromise<K>)
    component: ((ctx: PromptContext<T>) => MaybePromise<{ button: StringSelectMenuBuilder; modal: ModalBuilder; }>);
}

/** A type representing a prompt state component, used when defining the components added for a prompt state */
export type PromptStateComponent<T extends object> = PromptStateButtonComponent<T> | PromptStateSelectMenuComponent<T> | PromptStateModalSelectMenuComponent<T> | PromptStateModalButtonComponent<T>;

// * Prompt State Types * //



/** A prompt state message callback */
export interface PromptStateMessageCallback<T extends object> {
    ephemeral: boolean;
    content?: string | ((ctx: PromptContext<T>) => MaybePromise<string>);
    embeds: EmbedBuilder[] | ((ctx: PromptContext<T>) => MaybePromise<EmbedBuilder[]>);
    components: PromptStateComponent<T>[][];
}

/**
 * A type representing a prompt state that is possible
 * @param T The type of the prompt context
 */
export interface PromptState<T extends object> {
    name: string;
    timeout?: number;
    onEntered?: (ctx: PromptContext<T>) => MaybePromise<string | undefined>;
    message: ((ctx: PromptContext<T>) => MaybePromise<PromptStateMessageCallback<T>>);
}

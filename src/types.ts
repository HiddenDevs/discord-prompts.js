import {
  ButtonBuilder, ButtonInteraction, EmbedBuilder, ModalBuilder, ModalSubmitInteraction, RepliableInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction,
} from 'discord.js';

export type MaybePromise<T> = T | Promise<T>;

export type PromptContext<T, I = RepliableInteraction> = T & { interaction?: I };

export const enum PromptComponentType {
    Button,
    ModalButton,
    SelectMenu,
    ModalSelectMenu
}

export interface PromptStateButtonComponent<T> {
    type: PromptComponentType.Button;
    component: ((ctx: PromptContext<T>) => MaybePromise<ButtonBuilder>);
    callback: string | ((ctx: PromptContext<T, ButtonInteraction>) => MaybePromise<string>);
}

export interface PromptStateSelectMenuComponent<T> {
    type: PromptComponentType.SelectMenu;
    component: ((ctx: PromptContext<T>) => MaybePromise<StringSelectMenuBuilder>);
    callback: string | ((ctx: PromptContext<T, StringSelectMenuInteraction>) => MaybePromise<string>);
}

export interface PromptStateModalButtonComponent<T> {
    type: PromptComponentType.ModalButton;
    component: ((ctx: PromptContext<T>) => MaybePromise<{ button: ButtonBuilder; modal: ModalBuilder; }>);
    callback: string | ((ctx: PromptContext<T, ButtonInteraction>, interaction: ModalSubmitInteraction) => MaybePromise<string>);
}

export interface PromptStateModalSelectMenuComponent<T, K extends boolean = boolean> {
    type: PromptComponentType.ModalSelectMenu;
    showModal?: K | ((ctx: PromptContext<T, StringSelectMenuInteraction>) => MaybePromise<K>)
    component: ((ctx: PromptContext<T>) => MaybePromise<{ button: StringSelectMenuBuilder; modal: ModalBuilder; }>);
    callback: string | ((ctx: PromptContext<T, StringSelectMenuInteraction>, interaction: K extends true ? ModalSubmitInteraction : null) => MaybePromise<string>);
}

export type PromptStateComponent<T> = PromptStateButtonComponent<T> | PromptStateSelectMenuComponent<T> | PromptStateModalSelectMenuComponent<T> | PromptStateModalButtonComponent<T>;

export interface PromptStateMessageCallback<T> {
    ephemeral: boolean;
    content?: string | ((ctx: PromptContext<T>) => MaybePromise<string>);
    embeds: EmbedBuilder[] | ((ctx: PromptContext<T>) => MaybePromise<EmbedBuilder[]>);
    components: PromptStateComponent<T>[][];
}

export interface PromptState<T> {
    name: string;
    timeout?: number;
    onEntered?: (ctx: PromptContext<T>) => MaybePromise<string | undefined>;
    message: ((ctx: PromptContext<T>) => MaybePromise<PromptStateMessageCallback<T>>);
}

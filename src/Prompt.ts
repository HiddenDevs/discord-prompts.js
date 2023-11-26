import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ComponentType,
	ModalBuilder,
	RepliableInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from 'discord.js';
import {
	PromptComponentType,
	PromptContext,
	PromptState,
	PromptStateComponent,
	PromptStateMessageCallback,
} from './types/prompt.types';
import { customId } from './util/customId';
import { PromptError } from './util/errors';

/**
 * A prompt that allows you to create a sequence of states that a user can go through
 * with discord js buttons and select menus.
 *
 * @example
 * ```ts
 * const prompt = new Prompt<ContextType>(defaults, initialState.name, [...]);
 * await prompt.start(interaction);
 * ```
 */
export class Prompt<T extends object> {
	/** The current context of this prompt */
	private context: PromptContext<T>;

	/** The current state */
	private currentState?: PromptState<T> & {
		components: (PromptStateComponent<T> & { customId: string; modal?: ModalBuilder })[];
	};

	/** Creates the prompt with a given set of states */
	constructor(
		defaults: T,
		public initialState: string,
		public states: PromptState<T>[],
	) {
		const previousStates: string[] = [];

		const goBack = () => {
			return this.context.previousStates.pop() ?? this.initialState;
		};

		this.context = { ...defaults, previousStates, goBack };
	}

	/**
	 * Starts the prompt with a given interaction
	 * @param interaction The interaction starting off the sequence
	 */
	public async start(interaction: RepliableInteraction): Promise<void> {
		this.context.interaction = interaction;

		await this.changeState(this.initialState, interaction);
	}

	private async changeState(newState: string, interaction: RepliableInteraction) {
		const state = this.states.find((c) => c.name === newState);
		if (!state) return Promise.reject(new PromptError(`State ${newState} not found.`));

		this.context.previousStates.push(this.currentState?.name ?? this.initialState);
		this.currentState = { ...state, components: [] };

		const shouldChangeState = await state.onEntered?.(this.context);
		if (shouldChangeState) this.changeState(shouldChangeState, interaction);

		const messageData = await state.message(this.context);
		const components = await this.formatComponents(messageData);
		const messageOptions = {
			components,
			fetchReply: true,
			ephemeral: messageData.ephemeral,
			content:
				typeof messageData.content === 'function'
					? await messageData.content?.(this.context)
					: messageData.content,
			embeds: Array.isArray(messageData.embeds) ? messageData.embeds : await messageData.embeds(this.context),
		};

		const msg =
			interaction.replied || interaction.deferred
				? await interaction.editReply(messageOptions)
				: await interaction.reply(messageOptions);

		const response = await msg
			.awaitMessageComponent<ComponentType.Button | ComponentType.StringSelect>({
				time: (state.timeout && state.timeout * 1000) || 120_000,
				filter: (i) => i.user.id === interaction.user.id,
			})
			.catch(() => null);

		if (!response) return;

		await this.handleCollect(response);
	}

	private async handleCollect(interaction: ButtonInteraction | StringSelectMenuInteraction) {
		this.context.interaction = interaction;

		const component = this.currentState?.components.find((c) => c.customId === interaction.customId);
		if (!component) throw new PromptError(`Couldn't find component with customId: ${interaction.customId}`);

		if (component.type === PromptComponentType.ModalSelectMenu) {
			const shouldShowModal =
				typeof component.showModal === 'boolean'
					? component.showModal
					: (await component.showModal?.(this.context as PromptContext<T, StringSelectMenuInteraction>)) ??
					  true;

			if (!shouldShowModal) {
				await interaction.deferUpdate();

				const newState =
					typeof component.callback === 'string'
						? component.callback
						: await component.callback(this.context as PromptContext<T, StringSelectMenuInteraction>, null);
				if (!newState) return interaction.deleteReply();

				return this.changeState(newState, interaction);
			}
		}

		if (
			component.type === PromptComponentType.ModalButton ||
			component.type === PromptComponentType.ModalSelectMenu
		) {
			const modal = component.modal!;

			await interaction.showModal(modal);

			const response = await interaction
				.awaitModalSubmit({
					time: 300000,
					filter: (i) => i.user.id === interaction.user.id && i.customId === component.customId,
				})
				.catch(() => null);

			if (!response) return;

			await response.deferUpdate();

			const newState =
				typeof component?.callback === 'string'
					? component.callback
					: await component?.callback(
							this.context as PromptContext<T, StringSelectMenuInteraction> &
								PromptContext<T, ButtonInteraction>,
							response,
					  );
			if (!newState) return interaction.deleteReply();

			return this.changeState(newState, interaction);
		}

		await interaction.deferUpdate();

		const newState =
			typeof component?.callback === 'string'
				? component.callback
				: await component?.callback(
						this.context as PromptContext<T, StringSelectMenuInteraction> &
							PromptContext<T, ButtonInteraction>,
				  );
		if (!newState) return interaction.deleteReply();

		await this.changeState(newState, interaction);
	}

	private async formatComponents(data: PromptStateMessageCallback<T>) {
		const rows = [];

		for (const row of data.components) {
			const actionRow = new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>();

			for (const component of row) {
				const builder = await component.component(this.context);

				if ('button' in builder) {
					const id = customId(this.currentState?.name ?? 'default');

					builder.button.setCustomId(id);
					builder.modal.setCustomId(id);

					this.currentState?.components.push({ ...component, customId: id, modal: builder.modal });

					actionRow.addComponents(builder.button);
				} else {
					const id = customId(this.currentState?.name ?? 'default');
					builder.setCustomId(id);

					this.currentState?.components.push({ ...component, customId: id });
					actionRow.addComponents(builder);
				}
			}

			rows.push(actionRow);
		}

		return rows;
	}
}

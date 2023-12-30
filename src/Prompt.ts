import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ComponentType,
	InteractionCollector,
	InteractionReplyOptions,
	ModalSubmitInteraction,
	RepliableInteraction,
	SnowflakeUtil,
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
	private currentState?: PromptState<T>;

	/** All components for this prompt */
	private components: (PromptStateComponent<T> & { id: string })[] = [];

	/** The interaction collector */
	private collector?: InteractionCollector<ButtonInteraction | StringSelectMenuInteraction>;

	/** The states represented in a map */
	public states: Map<string, PromptState<T>>;

	/** Creates the prompt with a given set of states */
	constructor(
		defaults: T,
		public initialState: string,
		states: PromptState<T>[],
	) {
		const previousStates: string[] = [];

		const goBack = () => {
			return this.context.previousStates.pop() ?? this.initialState;
		};

		this.context = { ...defaults, previousStates, goBack };
		this.states = new Map(states.map((s) => [s.name, s]));
	}

	/**
	 * Starts the prompt with a given interaction
	 * @param interaction The interaction starting off the sequence
	 * @returns {boolean} If true, the prompt started successfully
	 */
	public async start(interaction: RepliableInteraction): Promise<boolean> {
		this.context.interaction = interaction;

		return this.changeState(this.initialState, interaction);
	}

	private async changeState(newState: string, interaction: RepliableInteraction): Promise<boolean> {
		const state = this.states.get(newState);
		if (!state) return Promise.reject(new PromptError(`State ${newState} not found.`));

		this.context.previousStates.push(this.currentState?.name ?? this.initialState);
		this.currentState = state;

		const shouldChangeState = await state.onEntered?.(this.context);
		if (shouldChangeState) return this.changeState(shouldChangeState, interaction);

		const messageOptions = await this.prepareMessageOptions(state);

		const msg =
			interaction.replied || interaction.deferred
				? await interaction.editReply(messageOptions)
				: await interaction.reply(messageOptions);

		if (this.collector) this.collector.stop();

		this.collector = msg.createMessageComponentCollector<ComponentType.Button | ComponentType.StringSelect>({
			time: state.timeout || 120_000,
			filter: (i) => i.user.id === interaction.user.id,
		});

		this.collector.on('collect', this.handleCollect.bind(this));

		return true;
	}

	private async handleCollect(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
		this.context.interaction = interaction;

		const component = this.components.find((c) => c.id === interaction.customId);
		if (!component) throw new PromptError(`Couldn't find component with customId: ${interaction.customId}`);

		if (
			component.type === PromptComponentType.ModalButton ||
			component.type === PromptComponentType.ModalSelectMenu
		) {
			const childComponents =
				typeof component.component === 'function'
					? await component.component(this.context)
					: component.component;
			const modal =
				typeof childComponents.modal === 'function'
					? await childComponents.modal(interaction as never) // temporary
					: childComponents.modal;

			if (!modal) {
				await interaction.deferUpdate();

				this.collector?.stop();

				const newState = await this.getNewStateFromCallback(component);
				if (!newState) return interaction.deleteReply();

				return void this.changeState(newState, interaction);
			}

			modal.setCustomId(component.id);

			await interaction.showModal(modal);

			const response = await interaction
				.awaitModalSubmit({
					time: 300000,
					filter: (i) => i.user.id === interaction.user.id && i.customId === component.id,
				})
				.catch(() => null);

			if (!response) return;

			await response.deferUpdate();

			this.collector?.stop();

			const newState = await this.getNewStateFromCallback(component, response);
			if (!newState) return interaction.deleteReply();

			return void this.changeState(newState, interaction);
		}

		await interaction.deferUpdate();

		this.collector?.stop();

		const newState = await this.getNewStateFromCallback(component);
		if (!newState) return interaction.deleteReply();

		return void this.changeState(newState, interaction);
	}

	private async prepareMessageOptions(state: PromptState<T>): Promise<InteractionReplyOptions> {
		const messageData = typeof state.message === 'object' ? state.message : await state.message(this.context);
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

		return messageOptions;
	}

	private async getNewStateFromCallback(
		component: PromptStateComponent<T>,
		modalInteraction?: ModalSubmitInteraction,
	): Promise<string | undefined> {
		if (typeof component.callback === 'string') return component.callback;

		if (
			component.type === PromptComponentType.ModalButton ||
			component.type == PromptComponentType.ModalSelectMenu
		) {
			if (!modalInteraction) throw new PromptError('No modal submit interaction found when required.');

			return component.callback(
				this.context as PromptContext<T, StringSelectMenuInteraction> & PromptContext<T, ButtonInteraction>,
				modalInteraction,
			);
		} else {
			return component.callback(
				this.context as PromptContext<T, StringSelectMenuInteraction> & PromptContext<T, ButtonInteraction>,
			);
		}
	}

	private async formatComponents(
		data: PromptStateMessageCallback<T>,
	): Promise<ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[]> {
		const rows = [];
		const components = Array.isArray(data.components) ? data.components : await data.components(this.context);

		for (const row of components) {
			const actionRow = new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>();

			for (const component of row) {
				const builder =
					typeof component.component === 'function'
						? await component.component(this.context)
						: component.component;
				const id = SnowflakeUtil.generate().toString();

				if ('button' in builder) {
					builder.button.setCustomId(id);

					this.components.push({ ...component, id });

					actionRow.addComponents(builder.button);
				} else {
					builder.setCustomId(id);

					this.components.push({ ...component, id });
					actionRow.addComponents(builder);
				}
			}

			rows.push(actionRow);
		}

		return rows;
	}
}

import { StringSelectMenuBuilder } from 'discord.js';
import { PromptComponentType, PromptState } from '../../../src';
import { MarketplacePostContext } from '..';
import { createPostState } from '.';

export const preCreatePostState: PromptState<MarketplacePostContext> = {
	name: 'preCreatePost',
	timeout: 300_000,
	message: () => ({
		ephemeral: true,
		embeds: [],
		components: [
			[
				{
					type: PromptComponentType.SelectMenu,
					component: (ctx) =>
						new StringSelectMenuBuilder().setPlaceholder('* Select post type').addOptions([
							{ label: 'Hiring', value: 'Hiring', default: ctx.selectedPost?.postType === 'Hiring' },
							{
								label: 'Hireable',
								value: 'Hireable',
								default: ctx.selectedPost?.postType === 'Hireable',
							},
						]),
					callback: (ctx) => {
						ctx.selectedPost!.postType = ctx.interaction!.values[0] as 'Hiring' | 'Hireable';

						return createPostState.name;
					},
				},
			],
		],
	}),
};

import { createPublishHandler } from '../src/createPublishHandler';
import { ServerlessPubSub } from '../src/ServerlessPubSub';

export const handler = createPublishHandler({
	pubSub: new ServerlessPubSub({

	}),
})

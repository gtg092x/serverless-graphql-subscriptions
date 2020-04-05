import { schema } from './schema'
import { createWebSocketHandler } from '../src/createWebsocketHandler';
import { ServerlessPubSub } from '../src/ServerlessPubSub';

export const handler = createWebSocketHandler(schema, {
	pubSub: new ServerlessPubSub(),
})

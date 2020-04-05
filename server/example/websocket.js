import { schema } from './schema'
import { createWebSocketHandler } from '../src/createWebsocketHandler';

export const handler = createWebSocketHandler(schema)

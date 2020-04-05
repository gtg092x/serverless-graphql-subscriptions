import { schema } from './schema'
import { createWebSocketHandler } from '../serverless-pub-sub/src/createWebsocketHandler'
import configurePubSub from './configurePubSub'

export const handler = createWebSocketHandler(schema, {
	pubSub: configurePubSub(),
})

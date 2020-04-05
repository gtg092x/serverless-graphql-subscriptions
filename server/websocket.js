import { schema } from './schema'
import { createWebSocketHandler } from '../serverless-pub-sub/src'
import configurePubSub from './configurePubSub'

export const handler = createWebSocketHandler(schema, {
	pubSub: configurePubSub(),
})

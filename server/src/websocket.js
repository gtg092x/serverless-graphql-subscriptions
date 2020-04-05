import { createSchema, pubSub } from './schema'
import { createWebSocketHandler } from '../../serverless-pub-sub/src'

const schemaPromise = createSchema().catch(console.error)

export const handler = createWebSocketHandler(schemaPromise, {
	pubSub,
})

import { createSchema, pubSub } from './schema'
import { createWebSocketHandler } from 'serverless-graphql-pubsub'

const schemaPromise = createSchema().catch(console.error)

export const handler = createWebSocketHandler({
	onConnect: async (auth) => {
		console.log('AUTH', auth)
		return {
			user: 'matt'
		}
	},
	onOperation: async () => {
		const schema = await schemaPromise
		return ({
			schema
		})
	},
	pubSub,
})

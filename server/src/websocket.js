import { createSchema, pubSub } from './schema'
import { createWebSocketHandler } from '../../serverless-pub-sub/src'

const schema = createSchema()

export const handler = createWebSocketHandler({
	onConnect: async (auth) => {

		return {
			user: 'matt'
		}
	},
	async onConnectHydrate (ctx) {
		return ctx
	},
	onOperation: async () => {
		return ({
			schema
		})
	},
	pubSub,
})

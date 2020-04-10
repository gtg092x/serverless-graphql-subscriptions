import { createSchema, pubSub } from './schema'
import { ApolloServer } from 'apollo-server-lambda'
import { DynamoService } from 'serverless-graphql-pubsub'
import { handler as publish } from './dynamo'

const {
	IS_OFFLINE
} = process.env

if (IS_OFFLINE) {
	DynamoService.beforePublish = (payload) => publish({
		Records: [{
			eventName: 'INSERT',
			dynamodb: {
				NewImage: payload
			}
		}]
	})
}

async function prepareHandler () {
	const schema = await createSchema()
	return new ApolloServer({
		schema,
		context: () => {
			return {
				pubSub,
			}
		}
	}).createHandler({
		cors: {
			origin: '*',
			credentials: true,
		}
	})
}

const handlerPm = prepareHandler().catch(console.error)

export const handler = (event, context, callback) => {
	handlerPm.then(handler => handler(event, context, callback))
}

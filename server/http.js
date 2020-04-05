import { schema } from './schema'
import { ApolloServer } from 'apollo-server-lambda'
import configurePubSub from './configurePubSub'
import { DynamoService } from '../serverless-pub-sub/src/services/dynamodbClient'
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

export const handler = new ApolloServer({
	schema,
	context: () => {
		return {
			pubSub: configurePubSub({
			})
		}
	}
}).createHandler({
	cors: {
		origin: '*',
		credentials: true,
	}
})

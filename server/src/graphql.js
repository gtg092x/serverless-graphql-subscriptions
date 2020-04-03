import { makeExecutableSchema } from 'graphql-tools'
import { ApolloServer, gql } from 'apollo-server-lambda'
import configurePubSub from './configurePubSub';

const typeDefs = gql`
	type Query {
		_: String
	}
	type Mutation {
		sendMessage(message: String!): String
	}
	type Subscription {
		listenMessage: String
	}
`

const resolvers = {
	Mutation: {
		sendMessage: async (root, { message }, { pubSub }) => {
			await pubSub.publish('MY_TOPIC', { listenMessage: message })
			return message
		}
	},
	Subscription: {
		listenMessage: {
			subscribe: (root, _, { pubSub }) => {
				return pubSub.asyncIterator('MY_TOPIC')
			}
		}
	}
}

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers,
})

const server = new ApolloServer({
	schema,
	context: (ctx) => {
		return {
			pubSub: configurePubSub()
		}
	}
})

export const handler = server.createHandler({
	cors: {
		origin: '*',
		credentials: true,
	}
})

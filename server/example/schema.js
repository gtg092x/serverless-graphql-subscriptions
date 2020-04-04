import { makeExecutableSchema } from 'graphql-tools'
import { gql } from 'apollo-server-lambda'

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

export const buildSchema = () => makeExecutableSchema({
	typeDefs,
	resolvers,
})

export const schema = buildSchema()

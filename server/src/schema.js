import {default as configurePubSub} from './configurePubSub'

import { makeExecutableSchema } from 'graphql-tools'
import { ApolloServer, gql } from 'apollo-server-lambda'

const typeDefs = gql`
	type Message {
		message: String
		createdAt: String
	}
	type Query {
		_: String
	}
	type Mutation {
		sendMessage(message: String!): String
	}
	type Subscription {
		listenMessage: Message
	}
`

const resolvers = {
	Mutation: {
		sendMessage: async (root, { message }, { pubSub }) => {
			await pubSub.publish('MY_TOPIC', { listenMessage: { message, createdAt: new Date() } })
			return message
		}
	},
	Subscription: {
		listenMessage: {
			async subscribe ({ id }, args, { pubSub }) {
				return pubSub.asyncIterator('MY_TOPIC')
			}
		}
	}
}

export const pubSub = configurePubSub()

export const createSchema = () => {
	return makeExecutableSchema({
		typeDefs,
		resolvers,
	})
}

export const schema = createSchema()

import { schema } from './schema';
import { ApolloServer } from 'apollo-server-lambda'
import configurePubSub from './configurePubSub';

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

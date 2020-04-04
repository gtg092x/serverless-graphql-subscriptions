import { PubSub } from 'graphql-subscriptions';
import { ServerlessPubSub } from '../src/ServerlessPubSub';

const configurePubSub = (options) => {
	// const pubSub = new PubSub()
	return new ServerlessPubSub(options)
}

export default configurePubSub

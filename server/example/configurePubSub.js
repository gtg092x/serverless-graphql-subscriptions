import { PubSub } from 'graphql-subscriptions';
import { DynamoPubSub } from '../src/DynamoPubSub';

const configurePubSub = (options) => {
	// const pubSub = new PubSub()
	return new DynamoPubSub(options)
}

export default configurePubSub

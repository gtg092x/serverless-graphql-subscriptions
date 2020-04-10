import { createPublishHandler } from 'serverless-graphql-pubsub'
import configurePubSub from './configurePubSub'

export const handler = createPublishHandler({
	pubSub: configurePubSub(),
})

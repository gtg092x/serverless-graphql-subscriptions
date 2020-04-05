import { createPublishHandler } from '../serverless-pub-sub/src/createPublishHandler'
import configurePubSub from './configurePubSub'

export const handler = createPublishHandler({
	pubSub: configurePubSub(),
})

import { createPublishHandler } from '../../serverless-pub-sub/src'
import configurePubSub from './configurePubSub'

export const handler = createPublishHandler({
	pubSub: configurePubSub(),
})

import { createPublishHandler } from '../../serverless-pub-sub/src'
import configurePubSub from './configurePubSub'

const {
	IS_OFFLINE = true,
} = process.env

export const handler = createPublishHandler({
	pubSub: configurePubSub(),
	isOffline: IS_OFFLINE,
})

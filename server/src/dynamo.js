import { createPublishHandler } from '../../serverless-pub-sub/src'
import configurePubSub from './configurePubSub'
import {schema} from './schema'

const {
	IS_OFFLINE = true,
} = process.env

export const handler = createPublishHandler({
	pubSub: configurePubSub(),
	isOffline: IS_OFFLINE,
	schema,
})

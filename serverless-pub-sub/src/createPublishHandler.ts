import DynamoDB from 'aws-sdk/clients/dynamodb'
import {ServerlessPubSub} from './ServerlessPubSub';

const parseNewEvent = DynamoDB.Converter.unmarshall

interface Options {
	pubSub: ServerlessPubSub;
	isOffline: boolean;
	logger?: Function,
}

const noop = () => undefined

export const createPublishHandler = (options: Options) => async (event: any) => {
	const { pubSub, isOffline, logger = noop } = options
	const subscription = event.Records[0]
	if(subscription.eventName !== 'INSERT') {
		logger(event)
		logger('Invalid event. Wrong dynamodb event type, can publish only `INSERT` events to subscribers.')
		return { statusCode: 200, body: '' }
	}
	const { topic, data } = isOffline ?
		subscription.dynamodb.NewImage :
		parseNewEvent(subscription.dynamodb.NewImage)
	return pubSub.pushMessageToConections(topic, data)
}

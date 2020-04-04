import DynamoDB from 'aws-sdk/clients/dynamodb'
import { DynamoPubSub } from './DynamoPubSub';

const parseNewEvent = DynamoDB.Converter.unmarshall

const { IS_OFFLINE } = process.env

export const createPublishHandler = (clientConfig) => async (event) => {
	const subscruptionEvent = event.Records[0]
	if(subscruptionEvent.eventName !== 'INSERT') {
		throw new Error('Invalid event. Wrong dynamodb event type, can publish only `INSERT` events to subscribers.')
	}
	const { topic, data } = IS_OFFLINE ?
		subscruptionEvent.dynamodb.NewImage :
		parseNewEvent(subscruptionEvent.dynamodb.NewImage)
	const pubSub = new DynamoPubSub(clientConfig)
	return pubSub.pushMessageToConections(topic, data)
}

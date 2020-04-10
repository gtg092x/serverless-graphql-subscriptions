import DynamoDB from 'aws-sdk/clients/dynamodb'
import {ServerlessPubSub} from './ServerlessPubSub';

const parseNewEvent = DynamoDB.Converter.unmarshall

export const createPublishHandler = ({ pubSub, isOffline }: { pubSub: ServerlessPubSub, isOffline: boolean }) => async (event: any) => {
	const subscruptionEvent = event.Records[0]
	if(subscruptionEvent.eventName !== 'INSERT') {
		throw new Error('Invalid event. Wrong dynamodb event type, can publish only `INSERT` events to subscribers.')
	}
	const { topic, data } = isOffline ?
		subscruptionEvent.dynamodb.NewImage :
		parseNewEvent(subscruptionEvent.dynamodb.NewImage)
	return pubSub.pushMessageToConections(topic, data)
}

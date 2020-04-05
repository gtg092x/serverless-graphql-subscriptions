import DynamoDB from 'aws-sdk/clients/dynamodb'

const parseNewEvent = DynamoDB.Converter.unmarshall

const { IS_OFFLINE } = process.env

export const createPublishHandler = ({ pubSub }: { pubSub: any }) => async (event: any) => {
	const subscruptionEvent = event.Records[0]
	if(subscruptionEvent.eventName !== 'INSERT') {
		throw new Error('Invalid event. Wrong dynamodb event type, can publish only `INSERT` events to subscribers.')
	}
	const { topic, data } = IS_OFFLINE ?
		subscruptionEvent.dynamodb.NewImage :
		parseNewEvent(subscruptionEvent.dynamodb.NewImage)
	return pubSub.pushMessageToConections(topic, data)
}

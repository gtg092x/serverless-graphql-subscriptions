import { ServerlessPubSub } from '../../serverless-pub-sub/src'

const {
	EVENTS_TABLE,
	TOPICS_TABLE,
	PUBLISH_ENDPOINT,
	IS_OFFLINE,
} = process.env


const dynamoOptions = IS_OFFLINE ? {
	region: 'localhost',
	endpoint: 'http://localhost:8001',
	accessKeyId: 'DEFAULT_ACCESS_KEY',
	secretAccessKey: 'DEFAULT_SECRET'
} : {}


const configurePubSub = () => {
	const options = {
		topicsTable: TOPICS_TABLE,
		eventsTable: EVENTS_TABLE,
		publishEndpoint: IS_OFFLINE ? 'http://localhost:3001' : PUBLISH_ENDPOINT,
		dynamoOptions,
	}
	return new ServerlessPubSub(options)
}

export default configurePubSub

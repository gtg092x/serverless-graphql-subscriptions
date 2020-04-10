import { ServerlessPubSub } from 'serverless-graphql-pubsub'

const {
	EVENTS_TABLE,
	TOPICS_TABLE,
	PUBLISH_ENDPOINT,
} = process.env


const dynamoOptions = {
	region: 'localhost',
	endpoint: 'http://localhost:8001',
	accessKeyId: 'DEFAULT_ACCESS_KEY',
	secretAccessKey: 'DEFAULT_SECRET'
}


const configurePubSub = () => {
	const options = {
		topicsTable: TOPICS_TABLE,
		eventsTable: EVENTS_TABLE,
		publishEndpoint: PUBLISH_ENDPOINT,
		dynamoOptions,
	}
	return new ServerlessPubSub(options)
}

export default configurePubSub

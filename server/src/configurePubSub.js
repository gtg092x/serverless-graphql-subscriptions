import { ServerlessPubSub } from '../../serverless-pub-sub/src'

const {
	EVENTS_TABLE,
	TOPICS_TABLE,
	PUBLISH_ENDPOINT,
} = process.env

const configurePubSub = () => {
	const options = {
		topicsTable: TOPICS_TABLE,
		eventsTable: EVENTS_TABLE,
		publishEndpoint: PUBLISH_ENDPOINT,
	}
	return new ServerlessPubSub(options)
}

export default configurePubSub

import { DynamoService } from './dynamodbClient'
import ConnectionManager from './ConnectionManager'

class TopicDispatcher {
	constructor() {
		this.dynamoDbService = new DynamoService()
	}

	async getSubscribers(topic) {
		return this
			.dynamoDbService
			.querySubscribersForTopic(topic)
	}

	async pushMessageToConnectionsForTopic(topic, data) {
		const subscribers = await this.getSubscribers(topic)
		const promises = subscribers.map(async ({ connectionId, subscriptionId }) => {
			const topicConnectionManager = new ConnectionManager(connectionId)
			try {
				const res = await topicConnectionManager.sendMessage({
					id: subscriptionId,
					payload: { data },
					type: 'data'
				})
				return res
			} catch(err) {
				if(err.statusCode === 410) {
					return topicConnectionManager.unsubscribe()
				}
			}
		})
		return Promise.all(promises)
	}

	async postMessage(topic, data) {
		return this
			.dynamoDbService
			.postMessageToTopic(topic, data)
	}
}

export default TopicDispatcher

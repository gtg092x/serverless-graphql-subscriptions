import { DynamoService } from './dynamodbClient'
import ConnectionManager from './ConnectionManager'

class TopicDispatcher {
	constructor(topic) {
		this.topic = topic
		this.dynamoDbService = new DynamoService()
	}

	async getSubscribers() {
		return this
			.dynamoDbService
			.querySubscribersForTopic(this.topic)
	}

	async pushMessageToConnections(data) {
		const subscribers = await this.getSubscribers()
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

	async postMessage(data) {
		return this
			.dynamoDbService
			.postMessageToTopic(this.topic, data)
	}
}

export default TopicDispatcher

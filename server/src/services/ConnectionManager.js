import { DynamoService } from './dynamodbClient'
import { ApiGatewayService } from './apiGatewayClient';

class ConnectionManager {
	constructor(connectionId, options = {}) {
		this.connectionId = connectionId
		this.gatewayService = new ApiGatewayService()
		this.dynamoDbService = new DynamoService()
		this.options = options
	}

	async getConnectionRecords() {
		return this.dynamoDbService
			.getInitialConnectionRecordsForConnectionId(this.connectionId)
	}

	async getTopics() {
		return this.dynamoDbService.queryTopicsForConnectionId(this.connectionId)
	}

	async unsubscribe() {
		const topics = await this.getTopics()
		return this.dynamoDbService.unsubscribeTopics(topics)
	}

	async sendMessage(message) {
		return this.gatewayService.postToConnection(this.connectionId, message)
	}

	async subscribe({ topic, subscriptionId }) {
		const ttl = this.options.ttl
		return this.dynamoDbService.putSubscriptionForConnectionId(
			this.connectionId,
			ttl,
			{ topic, subscriptionId }
		)
	}

	async connect() {
		return this.subscribe({
			topic: 'INITIAL_CONNECTION'
		})
	}
}

export default ConnectionManager

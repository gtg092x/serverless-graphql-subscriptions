import { ApiGatewayService } from './apiGatewayClient';
import {DynamoService} from './dynamodbClient';
import {ConnectionOptions, TopicRow, TopicSubscriptionPayload} from './types';



class ConnectionManager {
	private connectionId: string;
	private gatewayService: ApiGatewayService;
	private dynamoDbService: DynamoService;
	private ttl?: number;

	constructor(
		connectionId: string,
		dynamoDbService: DynamoService,
		options: ConnectionOptions,
	) {
		this.connectionId = connectionId
		this.gatewayService = new ApiGatewayService(options.publishEndpoint)
		this.dynamoDbService = dynamoDbService
		this.ttl = options.ttl
	}

	async getConnectionRecords() {
		return this.dynamoDbService
			.getInitialConnectionRecordsForConnectionId(this.connectionId)
	}

	async getTopics(): Promise<TopicRow[]> {
		const items = await this.dynamoDbService
			.queryTopicsForConnectionId(this.connectionId)
		if (items === undefined) {
			return []
		}
		return items.map(i => i as TopicRow)
	}

	async unsubscribe() {
		const topics = await this.getTopics()
		return this.dynamoDbService
			.unsubscribeTopics(topics)
	}

	async sendMessage(message: any) {
		return this.gatewayService
			.postToConnection(this.connectionId, message)
	}

	async subscribe({ topic, subscriptionId }: TopicSubscriptionPayload) {
		const ttl = this.ttl
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

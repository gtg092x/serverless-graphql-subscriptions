import { ApiGatewayService } from './apiGatewayClient';
import {DynamoService} from './dynamodbClient';
import {ConnectionOptions, TopicRow, TopicSubscriptionPayload} from './types';



class ConnectionManager {
	connectionId: string;
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
		const record = await this.dynamoDbService
			.getInitialConnectionRecordsForConnectionId(this.connectionId)
		return record ? {
			...record,
			context: record.context ? JSON.parse(record.context) : undefined,
		} : record
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

	async setConnectionContext(context: any) {
		return this.dynamoDbService.patchSubscriptionForConnectionId(
			this.connectionId,
			{ context: JSON.stringify(context) }
		)
	}

	async sendMessage(message: any) {
		return this.gatewayService
			.postToConnection(this.connectionId, message)
	}

	async subscribe({ context, topic, subscriptionId }: TopicSubscriptionPayload) {
		const ttl = this.ttl
		return this.dynamoDbService.putSubscriptionForConnectionId(
			this.connectionId,
			ttl,
			{ topic, subscriptionId, context: JSON.stringify(context) }
		)
	}

	async connect(additionalContext?: any) {
		return this.subscribe({
			topic: 'INITIAL_CONNECTION',
			context: additionalContext,
		})
	}
}

export default ConnectionManager

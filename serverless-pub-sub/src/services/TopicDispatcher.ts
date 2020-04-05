import ConnectionManager from './ConnectionManager'
import {DynamoService} from './dynamodbClient';
import {ConnectionOptions} from './types';

class TopicDispatcher {
	private readonly dynamoDbService: DynamoService;
	private readonly options: ConnectionOptions;

	constructor(
		dynamoDbService: DynamoService,
		options: ConnectionOptions
	) {
		this.dynamoDbService = dynamoDbService
		this.options = options
	}

	async getSubscribers(topic: string) {
		const subs = await this
			.dynamoDbService
			.querySubscribersForTopic(topic)
		if (subs === undefined) {
			return []
		}
		return subs
	}

	async pushMessageToConnectionsForTopic(topic: string, data: any) {
		const subscribers = await this.getSubscribers(topic)
		const promises = subscribers.map(async ({ connectionId, subscriptionId }) => {
			const topicConnectionManager = new ConnectionManager(
				connectionId,
				this.dynamoDbService,
				this.options,
			)
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

	async postMessage(topic: string, data: any) {
		return this
			.dynamoDbService
			.postMessageToTopic(topic, data)
	}
}

export default TopicDispatcher

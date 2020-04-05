import DynamoDB, {
	BatchWriteItemRequestMap,
	DocumentClient,
	WriteRequest
} from 'aws-sdk/clients/dynamodb'
import uuid from 'uuid';
import {TopicRow, TopicSubscriptionPayload} from './types';

const localConfig = {
	region: 'localhost',
	endpoint: 'http://localhost:8000',
	accessKeyId: 'DEFAULT_ACCESS_KEY',
	secretAccessKey: 'DEFAULT_SECRET'
}

const {
	AWS_REGION,
	IS_OFFLINE,
} = process.env

const remoteConfig = {
	region: AWS_REGION
}

export interface DynamoTableConfig {
	topicsTable: string;
	eventsTable: string;
}

const twoHoursFromNow = () => Math.floor(Date.now() / 1000) + 60 * 60 * 2

export class DynamoService {
	private readonly tableConfig: DynamoTableConfig;
	private readonly client: DocumentClient;

	constructor(tableConfig: DynamoTableConfig) {
		this.client = new DynamoDB.DocumentClient(IS_OFFLINE ? localConfig : remoteConfig)
		this.tableConfig = tableConfig
	}

	getTopicsTable() {
		return this.tableConfig.topicsTable
	}

	getEventsTable() {
		return this.tableConfig.eventsTable
	}

	async getInitialConnectionRecordsForConnectionId(connectionId: string) {
		const { Item } = await this.client.get({
			TableName: this.getTopicsTable(),
			Key: {
				connectionId,
				topic: 'INITIAL_CONNECTION'
			}
		}).promise()
		return Item
	}

	async queryTopicsForConnectionId(connectionId: string) {
		const { Items: topics } = await this.client.query({
			ExpressionAttributeValues: {
				':connectionId': connectionId
			},
			IndexName: 'reverse',
			KeyConditionExpression: 'connectionId = :connectionId',
			ProjectionExpression: 'topic, connectionId',
			TableName: this.getTopicsTable(),
		}).promise()
		return topics
	}

	async querySubscribersForTopic(topic: string) {
		const { Items: clients } = await this.client.query({
			ExpressionAttributeValues: {
				':topic': topic
			},
			KeyConditionExpression: 'topic = :topic',
			ProjectionExpression: 'connectionId, subscriptionId',
			TableName: this.getTopicsTable(),
		}).promise()
		return clients
	}

	async removeItems(RequestItems: BatchWriteItemRequestMap) {
		const res = await this.client.batchWrite({
			RequestItems
		}).promise()
		if(res.UnprocessedItems && res.UnprocessedItems.length) {
			this.removeItems(res.UnprocessedItems)
			return
		}
	}

	async unsubscribeTopics(topics: TopicRow[]) {
		await this.removeItems({
			[this.getTopicsTable()]: topics.map(({ topic, connectionId }) => ({
				DeleteRequest: { Key: { topic, connectionId } }
			}) as WriteRequest)
		})
		return
	}

	async putSubscriptionForConnectionId(
		connectionId: string,
		ttl: number | undefined,
		{ topic, subscriptionId }: TopicSubscriptionPayload,
	) {
		return this.client.put({
			Item: {
				topic,
				subscriptionId,
				connectionId,
				ttl: typeof ttl === 'number' ? ttl : twoHoursFromNow(),
			},
			TableName: this.getTopicsTable(),
		}).promise()
	}

	static beforePublish: (payload: any) => any;

	async postMessageToTopic(topic: string, data: any) {
		const payload = {
			data,
			topic,
			id: uuid.v4(),
		}
		if(DynamoService.beforePublish) {
			await DynamoService.beforePublish(payload)
		}
		return this.client.put({
			Item: payload,
			TableName: this.getEventsTable(),
		}).promise()
	}

}

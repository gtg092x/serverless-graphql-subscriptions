import DynamoDB, {
	BatchWriteItemRequestMap,
	DocumentClient,
	WriteRequest
} from 'aws-sdk/clients/dynamodb'
import uuid from 'uuid';
import {TopicConextPayload, TopicRow, TopicSubscriptionPayload} from './types';

export interface LoggingInputOptions {
	logger?: Function;
}

export interface LoggingOptions {
	logger: Function;
}

export interface DynamoTableConfig {
	topicsTable: string;
	eventsTable: string;
	dynamoOptions?: DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration;
}

function iter(o: any, map: Function) {
	const result: any = {}
	Object.keys(o).forEach(function (k) {
		if (o[k] !== null && typeof o[k] === 'object' && !(o[k] instanceof Date)) {
			result[k] = iter(o[k], map);
			return;
		}
		result[k] = map(o[k]);
	});
	return result
}

const normalizeData = (data: object) => JSON.parse(JSON.stringify(data))

const twoHoursFromNow = () => Math.floor(Date.now() / 1000) + (60 * 60 * 2)

export class DynamoService {
	private readonly tableConfig: DynamoTableConfig & LoggingOptions;
	private readonly client: DocumentClient;

	constructor(tableConfig: DynamoTableConfig & LoggingOptions) {
		this.client = new DynamoDB.DocumentClient(tableConfig.dynamoOptions)
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
			ProjectionExpression: 'connectionId, subscriptionId, operation',
			TableName: this.getTopicsTable(),
		}).promise()
		return clients
	}

	async removeItems(RequestItems: BatchWriteItemRequestMap) {
		const res = await this.client.batchWrite({
			RequestItems,
		}).promise()
		if(res.UnprocessedItems && res.UnprocessedItems.length) {
			this.removeItems(res.UnprocessedItems)
			return
		}
	}

	async unsubscribeTopics(topics: TopicRow[]) {
		this.log('Unsubscribing Topics ', topics)
		await this.removeItems({
			[this.getTopicsTable()]: topics.map(({ topic, connectionId }) => ({
				DeleteRequest: { Key: { topic, connectionId } }
			}) as WriteRequest)
		})
		return
	}

	log (...params: any[]) {
		this.tableConfig.logger(...params)
	}

	async putSubscriptionForConnectionId(
		connectionId: string,
		ttl: number | undefined,
		{ topic, subscriptionId, context, operation }: TopicSubscriptionPayload,
	) {
		this.log('Subscribing to topic ' + topic)
		return this.client.put({
			Item: {
				topic,
				subscriptionId,
				connectionId,
				context: context ? normalizeData(context) : {},
				operation: operation ? normalizeData(operation) : {},
				ttl: typeof ttl === 'number' ? ttl : twoHoursFromNow(),
			},
			TableName: this.getTopicsTable(),
		}).promise()
	}

	async patchSubscriptionForConnectionId(
		connectionId: string,
		{ context }: TopicConextPayload,
	) {
		const ContextUpdate: any = {
			Action: context ? 'PUT' : 'DELETE',
		}
		if (context) {
			ContextUpdate.Value = context
		}
		return this.client.update({
			Key: {
				connectionId,
				topic: 'INITIAL_CONNECTION'
			},
			AttributeUpdates: {
				context: ContextUpdate,
			},
			TableName: this.getTopicsTable(),
		}).promise()
	}

	static beforePublish: (payload: any) => any;

	async postMessageToTopic(topic: string, data: any) {
		const normalizedData = normalizeData(data)
		const item = {
			data: normalizedData,
			topic,
			id: uuid.v4(),
		}

		if(DynamoService.beforePublish) {
			await DynamoService.beforePublish(item)
		}

		return this.client.put({
			Item: item,
			TableName: this.getEventsTable(),
		}).promise()
	}

}

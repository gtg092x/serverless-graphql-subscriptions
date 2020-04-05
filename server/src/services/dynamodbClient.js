import DynamoDB from 'aws-sdk/clients/dynamodb'
import uuid from 'uuid';

const localConfig = {
	region: 'localhost',
	endpoint: 'http://localhost:8000',
	accessKeyId: 'DEFAULT_ACCESS_KEY',
	secretAccessKey: 'DEFAULT_SECRET'
}

const {
	AWS_REGION,
	EVENTS_TABLE,
	IS_OFFLINE,
	TOPICS_TABLE,
} = process.env

const remoteConfig = {
	region: AWS_REGION
}

let client

export class DynamoService {
	constructor() {
		client = client || new DynamoDB.DocumentClient(IS_OFFLINE ? localConfig : remoteConfig)
		this.client = client
	}

	async getInitialConnectionRecordsForConnectionId(connectionId) {
		const { Item } = await this.client.get({
			TableName: TOPICS_TABLE,
			Key: {
				connectionId,
				topic: 'INITIAL_CONNECTION'
			}
		}).promise()
		return Item
	}

	async queryTopicsForConnectionId(connectionId) {
		const { Items: topics } = await this.client.query({
			ExpressionAttributeValues: {
				':connectionId': connectionId
			},
			IndexName: 'reverse',
			KeyConditionExpression: 'connectionId = :connectionId',
			ProjectionExpression: 'topic, connectionId',
			TableName: TOPICS_TABLE,
		}).promise()
		return topics
	}

	async querySubscribersForTopic(topic) {
		const { Items: clients } = await this.client.query({
			ExpressionAttributeValues: {
				':topic': topic
			},
			KeyConditionExpression: 'topic = :topic',
			ProjectionExpression: 'connectionId, subscriptionId',
			TableName: TOPICS_TABLE,
		}).promise()
		return clients
	}

	async removeItems(RequestItems) {
		const res = await this.client.batchWrite({
			RequestItems
		}).promise()
		if(res.UnprocessedItems && res.UnprocessedItems.length) {
			return this.removeItems(res.UnprocessedItems)
		}
	}

	async unsubscribeTopics(topics) {
		return this.removeItems({
			[TOPICS_TABLE]: topics.map(({ topic, connectionId }) => ({
				DeleteRequest: { Key: { topic, connectionId } }
			}))
		})
	}

	async putSubscriptionForConnectionId(connectionId, ttl, { topic, subscriptionId }) {
		return this.client.put({
			Item: {
				topic,
				subscriptionId,
				connectionId,
				ttl: typeof ttl === 'number' ? ttl : Math.floor(Date.now() / 1000) + 60 * 60 * 2,
			},
			TableName: TOPICS_TABLE,
		}).promise()
	}

	async postMessageToTopic(topic, data) {
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
			TableName: EVENTS_TABLE,
		}).promise()
	}

}

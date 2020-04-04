import uuid from 'uuid'
import dynamodbClient from './dynamodbClient'
import { handler as publish } from '../../example/dynamo'
import ConnectionManager from './ConnectionManager'

const {
	IS_OFFLINE,
	TOPICS_TABLE,
	EVENTS_TABLE,
} = process.env

class Topic {
	constructor(topic) {
		this.topic = topic
	}

	async getSubscribers() {
		const { Items: clients } = await dynamodbClient.query({
			ExpressionAttributeValues: {
				':topic': this.topic
			},
			KeyConditionExpression: 'topic = :topic',
			ProjectionExpression: 'connectionId, subscriptionId',
			TableName: TOPICS_TABLE,
		}).promise()
		return clients
	}

	async pushMessageToConnections(data) {
		const subscribers = await this.getSubscribers()
		const promises = subscribers.map(async ({ connectionId, subscriptionId }) => {
			const TopicSubscriber = new ConnectionManager(connectionId)
			try {
				const res = await TopicSubscriber.sendMessage({
					id: subscriptionId,
					payload: { data },
					type: 'data'
				})
				return res
			} catch(err) {
				if(err.statusCode === 410) {	// this dynamoDBClient has disconnected unsubscribe it
					return TopicSubscriber.unsubscribe()
				}
			}
		})
		return Promise.all(promises)
	}

	async postMessage(data) {
		const payload = {
			data,
			topic: this.topic,
			id: uuid.v4(),
		}
		if(IS_OFFLINE) {
			await publish({
				Records: [{
					eventName: 'INSERT',
					dynamodb: {
						NewImage: payload
					}
				}]
			})
		}
		return dynamodbClient.put({
			Item: payload,
			TableName: EVENTS_TABLE,
		}).promise()
	}
}

export default Topic

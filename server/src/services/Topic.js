import uuid from 'uuid'
import client from '../dynamodb'
import { handler as publish } from '../../example/dynamo'
import Client from './Client'

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
		const { Items: clients } = await client.query({
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
			const TopicSubscriber = new Client(connectionId)
			try {
				const res = await TopicSubscriber.sendMessage({
					id: subscriptionId,
					payload: { data },
					type: 'data'
				})
				return res
			} catch(err) {
				if(err.statusCode === 410) {	// this client has disconnected unsubscribe it
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
		return client.put({
			Item: payload,
			TableName: EVENTS_TABLE,
		}).promise()
	}
}

export default Topic

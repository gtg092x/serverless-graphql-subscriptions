import { PubSubEngine } from 'graphql-subscriptions';
import { $$asyncIterator } from 'iterall';
import TopicDispatcher from './services/TopicDispatcher';
import ConnectionManager from './services/ConnectionManager';
import { DynamoService } from './services/dynamodbClient';

class PubSubAsyncIterator {

	constructor(pubsub, eventNames) {
		this.pubsub = pubsub;
		this.pullQueue = [];
		this.pushQueue = [];
		this.listening = true;
		this.eventsArray = typeof eventNames === 'string' ? [eventNames] : eventNames;
	}

	async return() {
		await this.emptyQueue();
		return { value: undefined, done: true };
	}

	[$$asyncIterator]() {
		return this;
	}

	pullValue() {
		return new Promise(resolve => {
			if (this.pushQueue.length !== 0) {
				resolve({ value: this.pushQueue.shift(), done: false });
			} else {
				this.pullQueue.push(resolve);
			}
		});
	}

	async pushValue(event) {
		await this.subscribeAll();
		if (this.pullQueue.length !== 0) {
			this.pullQueue.shift()({ value: event, done: false });
		} else {
			this.pushQueue.push(event);
		}
	}

	subscribeAll() {
		if (!this.subscriptionPromises) {
			this.subscriptionPromises = Promise.all(this.eventsArray.map(
				eventName => this.pubsub.subscribe(eventName, this.pushValue.bind(this), this.options),
			));
		}
		return this.subscriptionPromises
	}

	async next() {
		await this.subscribeAll();
		return this.listening ? this.pullValue() : this.return();
	}
}

export class ServerlessPubSub extends PubSubEngine {
	async publish(trigger, payload) {
		await this.topicDispatcher.postMessage(trigger, payload)
	}
	async pushMessageToConections(trigger, payload) {
		await this.topicDispatcher.pushMessageToConnectionsForTopic(trigger, payload)
	}
	constructor(options) {
		super()
		this.iterators = []
		this.dynamoDbService = new DynamoService(options)
		this.topicDispatcher = new TopicDispatcher(this.dynamoDbService, options)
		this.options = options
	}

	setConnectionManager(client) {
		this.connectionManager = client
	}

	setSubscriptionId(subscriptionId) {
		this.subscriptionId = subscriptionId
	}

	async subscribe(
		trigger,
		onMessage,
		options,
	) {

		await this.connectionManager.subscribe({
			subscriptionId: this.subscriptionId,
			topic: trigger,
		})
		return this.subscriptionId
	}

	unsubscribe(subId) {
		return this.connectionManager.unsubscribe()
	}

	createAndSetConnectionManager(connectionId) {
		const connectionManager = new ConnectionManager(
			connectionId,
			this.dynamoDbService,
			this.options,
		)
		this.setConnectionManager(connectionManager)
		return connectionManager
	}

	asyncIterator(triggers) {
		const iterator = new PubSubAsyncIterator(this, triggers)
		this.iterators.push(iterator)
		return iterator
	}

	storeAllSubscriptions() {
		return Promise.all(this.iterators.map(i => i.subscribeAll()))
	}

}

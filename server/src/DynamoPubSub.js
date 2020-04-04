import { PubSubEngine } from 'graphql-subscriptions';
import { $$asyncIterator } from 'iterall';
import Topic from './services/Topic';

class PubSubAsyncIterator {

	constructor(pubsub, eventNames, options) {
		this.pubsub = pubsub;
		this.options = options;
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

export class DynamoPubSub extends PubSubEngine {
	async publish(trigger, payload) {
		await new Topic(trigger).postMessage(payload)
	}
	async pushMessageToConections(trigger, payload) {
		await new Topic(trigger).pushMessageToConnections(payload)
	}
	constructor(options = {}) {
		super()
		const { ttl, client, operation } = options
		this.ttl = ttl;
		this.operation = operation;
		this.iterators = []
		this.client = client
	}


	async subscribe(
		trigger,
		onMessage,
		options,
	) {
		const id = this.operation.id
		const triggerName = trigger


		await this.client.subscribe({
			ttl: this.ttl,
			subscriptionId: id,
			topic: triggerName,
		})
		return id
	}

	unsubscribe(subId) {
		return this.client.unsubscribe()
	}

	asyncIterator(triggers, options) {
		const iterator = new PubSubAsyncIterator(this, triggers, options)
		this.iterators.push(iterator)
		return iterator
	}

	flushSubscriptions() {
		return Promise.all(this.iterators.map(i => i.subscribeAll()))
	}

	getSubscriber() {
		return this.client
	}

	getPublisher() {
		return this.client
	}

	close() {

	}

	onMessage(pattern, channel, message) {

	}
}

import { PubSubEngine } from 'graphql-subscriptions';
import { $$asyncIterator } from 'iterall';
import TopicDispatcher from './services/TopicDispatcher';
import ConnectionManager from './services/ConnectionManager';
import {
	DynamoService,
	DynamoTableConfig,
	LoggingInputOptions, LoggingOptions,
} from './services/dynamodbClient';
import {ConnectionOptions} from './services/types';

interface IteratorType {
	done: boolean;
	value: any;
}

class PubSubAsyncIterator implements AsyncIterator<IteratorType>{

	private readonly pubSub: ServerlessPubSub;
	private readonly eventsArray: string[];
	private listening: boolean;

	constructor(
		pubSub: ServerlessPubSub,
		eventNames?: string[] | string
	) {
		this.pubSub = pubSub;
		this.listening = true;
		if (eventNames === undefined) {
			throw new Error('Event names is required')
		}
		this.eventsArray = typeof eventNames === 'string' ? [eventNames] : eventNames;
	}

	async return() {
		return { value: undefined, done: true } as IteratorType;
	}

	[$$asyncIterator]() {
		return this;
	}


	private subscriptionPromises?: Promise<(string | number | undefined)[]>;

	subscribeAll() {
		if (!this.subscriptionPromises) {
			this.subscriptionPromises = Promise.all(this.eventsArray.map(
				eventName => this.pubSub._subscribe(eventName),
			));
		}
		return this.subscriptionPromises
	}

	async next() {
		await this.subscribeAll();
		return this.return();
	}
}

const noop = () => undefined

export class ServerlessPubSub extends PubSubEngine {
	private readonly topicDispatcher: TopicDispatcher;
	private readonly dynamoDbService: DynamoService;
	private readonly iterators: PubSubAsyncIterator[];
	private readonly options: ConnectionOptions & DynamoTableConfig;
	private connectionManager?: ConnectionManager;
	private subscriptionId?: string | number;

	constructor(options: ConnectionOptions & DynamoTableConfig & LoggingInputOptions) {
		super()
		this.iterators = []
		options.logger = options.logger ? options.logger : noop;
		this.dynamoDbService = new DynamoService(options as ConnectionOptions & DynamoTableConfig & LoggingOptions)
		this.topicDispatcher = new TopicDispatcher(this.dynamoDbService, options)
		this.options = options
	}
	async publish(trigger: string, payload: any) {
		await this.topicDispatcher.postMessage(trigger, payload)
	}
	async pushMessageToConections(
		trigger: string,
		payload: any,
	) {
		await this.topicDispatcher.pushMessageToConnectionsForTopic(trigger, payload)
	}

	setConnectionManager(client: ConnectionManager) {
		this.connectionManager = client
	}

	setSubscriptionId(subscriptionId: string | number) {
		this.subscriptionId = subscriptionId
	}

	getConnectionManager() {
		if (this.connectionManager === undefined) {
			throw new Error('Connection Manager is required')
		}
		return this.connectionManager
	}

	getSubscriptionId() {
		if (this.subscriptionId === undefined) {
			throw new Error('Subscription Id is required')
		}
		return this.subscriptionId
	}

	subscribe (
		trigger: string,
	): Promise<number> {
		throw new Error('Subscribe is not implemented on ServerlessPubSub')
	}

	async _subscribe(
		trigger: string,
	) {

		const subscriptionId = this.getSubscriptionId()

		await this.getConnectionManager().subscribe({
			subscriptionId,
			topic: trigger,
		})
		return Number(subscriptionId)
	}

	unsubscribe() {
		return this.getConnectionManager().unsubscribe()
	}

	createAndSetConnectionManager(connectionId: string) {
		const connectionManager = new ConnectionManager(
			connectionId,
			this.dynamoDbService,
			this.options,
		)
		this.setConnectionManager(connectionManager)
		return connectionManager
	}

	asyncIterator(triggers: string | string[]): PubSubAsyncIterator {
		const iterator = new PubSubAsyncIterator(this, triggers)
		this.iterators.push(iterator)
		return iterator
	}

	storeAllSubscriptions() {
		if (!this.iterators || this.iterators.length === 0) {
			throw new Error('No iterators found, did you forget to subscribe to the pub sub?');
		}
		return Promise.all(this.iterators.map(i => i.subscribeAll()))
	}

}

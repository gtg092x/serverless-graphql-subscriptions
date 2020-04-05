"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_subscriptions_1 = require("graphql-subscriptions");
const iterall_1 = require("iterall");
const TopicDispatcher_1 = __importDefault(require("./services/TopicDispatcher"));
const ConnectionManager_1 = __importDefault(require("./services/ConnectionManager"));
const dynamodbClient_1 = require("./services/dynamodbClient");
class PubSubAsyncIterator {
    constructor(pubSub, eventNames) {
        this.pubSub = pubSub;
        this.listening = true;
        if (eventNames === undefined) {
            throw new Error('Event names is required');
        }
        this.eventsArray = typeof eventNames === 'string' ? [eventNames] : eventNames;
    }
    async return() {
        return { value: undefined, done: true };
    }
    [iterall_1.$$asyncIterator]() {
        return this;
    }
    subscribeAll() {
        if (!this.subscriptionPromises) {
            this.subscriptionPromises = Promise.all(this.eventsArray.map(eventName => this.pubSub.subscribe(eventName)));
        }
        return this.subscriptionPromises;
    }
    async next() {
        await this.subscribeAll();
        return this.return();
    }
}
class ServerlessPubSub extends graphql_subscriptions_1.PubSubEngine {
    constructor(options) {
        super();
        this.iterators = [];
        this.dynamoDbService = new dynamodbClient_1.DynamoService(options);
        this.topicDispatcher = new TopicDispatcher_1.default(this.dynamoDbService, options);
        this.options = options;
    }
    async publish(trigger, payload) {
        await this.topicDispatcher.postMessage(trigger, payload);
    }
    async pushMessageToConections(trigger, payload) {
        await this.topicDispatcher.pushMessageToConnectionsForTopic(trigger, payload);
    }
    setConnectionManager(client) {
        this.connectionManager = client;
    }
    setSubscriptionId(subscriptionId) {
        this.subscriptionId = subscriptionId;
    }
    getConnectionManager() {
        if (this.connectionManager === undefined) {
            throw new Error('Connection Manager is required');
        }
        return this.connectionManager;
    }
    getSubscriptionId() {
        if (this.subscriptionId === undefined) {
            throw new Error('Subscription Id is required');
        }
        return this.subscriptionId;
    }
    async subscribe(trigger) {
        const subscriptionId = this.getSubscriptionId();
        await this.getConnectionManager().subscribe({
            subscriptionId,
            topic: trigger,
        });
        return Number(subscriptionId);
    }
    unsubscribe() {
        return this.getConnectionManager().unsubscribe();
    }
    createAndSetConnectionManager(connectionId) {
        const connectionManager = new ConnectionManager_1.default(connectionId, this.dynamoDbService, this.options);
        this.setConnectionManager(connectionManager);
        return connectionManager;
    }
    asyncIterator(triggers) {
        const iterator = new PubSubAsyncIterator(this, triggers);
        this.iterators.push(iterator);
        return iterator;
    }
    storeAllSubscriptions() {
        return Promise.all(this.iterators.map(i => i.subscribeAll()));
    }
}
exports.ServerlessPubSub = ServerlessPubSub;
//# sourceMappingURL=ServerlessPubSub.js.map
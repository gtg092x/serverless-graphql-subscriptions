"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dynamodb_1 = __importDefault(require("aws-sdk/clients/dynamodb"));
const uuid_1 = __importDefault(require("uuid"));
const localConfig = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'DEFAULT_ACCESS_KEY',
    secretAccessKey: 'DEFAULT_SECRET'
};
const { AWS_REGION, IS_OFFLINE, } = process.env;
const remoteConfig = {
    region: AWS_REGION
};
const twoHoursFromNow = () => Math.floor(Date.now() / 1000) + 60 * 60 * 2;
class DynamoService {
    constructor(tableConfig) {
        this.client = new dynamodb_1.default.DocumentClient(IS_OFFLINE ? localConfig : remoteConfig);
        this.tableConfig = tableConfig;
    }
    getTopicsTable() {
        return this.tableConfig.topicsTable;
    }
    getEventsTable() {
        return this.tableConfig.eventsTable;
    }
    async getInitialConnectionRecordsForConnectionId(connectionId) {
        const { Item } = await this.client.get({
            TableName: this.getTopicsTable(),
            Key: {
                connectionId,
                topic: 'INITIAL_CONNECTION'
            }
        }).promise();
        return Item;
    }
    async queryTopicsForConnectionId(connectionId) {
        const { Items: topics } = await this.client.query({
            ExpressionAttributeValues: {
                ':connectionId': connectionId
            },
            IndexName: 'reverse',
            KeyConditionExpression: 'connectionId = :connectionId',
            ProjectionExpression: 'topic, connectionId',
            TableName: this.getTopicsTable(),
        }).promise();
        return topics;
    }
    async querySubscribersForTopic(topic) {
        const { Items: clients } = await this.client.query({
            ExpressionAttributeValues: {
                ':topic': topic
            },
            KeyConditionExpression: 'topic = :topic',
            ProjectionExpression: 'connectionId, subscriptionId',
            TableName: this.getTopicsTable(),
        }).promise();
        return clients;
    }
    async removeItems(RequestItems) {
        const res = await this.client.batchWrite({
            RequestItems
        }).promise();
        if (res.UnprocessedItems && res.UnprocessedItems.length) {
            this.removeItems(res.UnprocessedItems);
            return;
        }
    }
    async unsubscribeTopics(topics) {
        await this.removeItems({
            [this.getTopicsTable()]: topics.map(({ topic, connectionId }) => ({
                DeleteRequest: { Key: { topic, connectionId } }
            }))
        });
        return;
    }
    async putSubscriptionForConnectionId(connectionId, ttl, { topic, subscriptionId }) {
        return this.client.put({
            Item: {
                topic,
                subscriptionId,
                connectionId,
                ttl: typeof ttl === 'number' ? ttl : twoHoursFromNow(),
            },
            TableName: this.getTopicsTable(),
        }).promise();
    }
    async postMessageToTopic(topic, data) {
        const payload = {
            data,
            topic,
            id: uuid_1.default.v4(),
        };
        if (DynamoService.beforePublish) {
            await DynamoService.beforePublish(payload);
        }
        return this.client.put({
            Item: payload,
            TableName: this.getEventsTable(),
        }).promise();
    }
}
exports.DynamoService = DynamoService;
//# sourceMappingURL=dynamodbClient.js.map
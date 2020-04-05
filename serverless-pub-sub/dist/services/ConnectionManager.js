"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiGatewayClient_1 = require("./apiGatewayClient");
class ConnectionManager {
    constructor(connectionId, dynamoDbService, options) {
        this.connectionId = connectionId;
        this.gatewayService = new apiGatewayClient_1.ApiGatewayService(options.publishEndpoint);
        this.dynamoDbService = dynamoDbService;
        this.ttl = options.ttl;
    }
    async getConnectionRecords() {
        return this.dynamoDbService
            .getInitialConnectionRecordsForConnectionId(this.connectionId);
    }
    async getTopics() {
        const items = await this.dynamoDbService
            .queryTopicsForConnectionId(this.connectionId);
        if (items === undefined) {
            return [];
        }
        return items.map(i => i);
    }
    async unsubscribe() {
        const topics = await this.getTopics();
        return this.dynamoDbService
            .unsubscribeTopics(topics);
    }
    async sendMessage(message) {
        return this.gatewayService
            .postToConnection(this.connectionId, message);
    }
    async subscribe({ topic, subscriptionId }) {
        const ttl = this.ttl;
        return this.dynamoDbService.putSubscriptionForConnectionId(this.connectionId, ttl, { topic, subscriptionId });
    }
    async connect() {
        return this.subscribe({
            topic: 'INITIAL_CONNECTION'
        });
    }
}
exports.default = ConnectionManager;
//# sourceMappingURL=ConnectionManager.js.map
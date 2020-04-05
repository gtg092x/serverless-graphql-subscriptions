"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConnectionManager_1 = __importDefault(require("./ConnectionManager"));
class TopicDispatcher {
    constructor(dynamoDbService, options) {
        this.dynamoDbService = dynamoDbService;
        this.options = options;
    }
    async getSubscribers(topic) {
        const subs = await this
            .dynamoDbService
            .querySubscribersForTopic(topic);
        if (subs === undefined) {
            return [];
        }
        return subs;
    }
    async pushMessageToConnectionsForTopic(topic, data) {
        const subscribers = await this.getSubscribers(topic);
        const promises = subscribers.map(async ({ connectionId, subscriptionId }) => {
            const topicConnectionManager = new ConnectionManager_1.default(connectionId, this.dynamoDbService, this.options);
            try {
                const res = await topicConnectionManager.sendMessage({
                    id: subscriptionId,
                    payload: { data },
                    type: 'data'
                });
                return res;
            }
            catch (err) {
                if (err.statusCode === 410) {
                    return topicConnectionManager.unsubscribe();
                }
            }
        });
        return Promise.all(promises);
    }
    async postMessage(topic, data) {
        return this
            .dynamoDbService
            .postMessageToTopic(topic, data);
    }
}
exports.default = TopicDispatcher;
//# sourceMappingURL=TopicDispatcher.js.map
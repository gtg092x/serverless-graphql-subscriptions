import { ConnectionOptions } from './ConnectionOptions';
interface TopicOptions extends ConnectionOptions {
}
interface DynamoSubscriptionRow {
    connectionId: string;
    subscriptionId: string;
}
declare class Topic {
    private options;
    private topic;
    static onPublish: (v: any) => any;
    constructor(topic: string, options?: TopicOptions);
    getTopicsTable(): string;
    getEventsTable(): string;
    getSubscribers(): Promise<DynamoSubscriptionRow[]>;
    pushMessageToConnections(data: object): Promise<any[]>;
    postMessage(data: object): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
}
export default Topic;
//# sourceMappingURL=Topic.d.ts.map
import { ConnectionOptions } from './ConnectionOptions';
interface SubscriptionArgs {
    topic: string;
    subscriptionId?: string | number;
    ttl?: number;
}
interface TopicDynamoRow {
    topic: string;
    connectionId: string;
}
declare class Client {
    private connectionId;
    private options;
    constructor(connectionId: string, options: ConnectionOptions);
    get(): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.AttributeMap | undefined>;
    getTopics(): Promise<TopicDynamoRow[]>;
    removeTopics(RequestItems: any): Promise<any>;
    unsubscribe(): Promise<any>;
    sendMessage(message: any): Promise<{
        $response: import("aws-sdk/lib/response").Response<{}, import("aws-sdk/lib/error").AWSError>;
    }>;
    subscribe({ topic, subscriptionId, ttl }: SubscriptionArgs): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
    connect(): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
    getTtl(): any;
}
export default Client;
//# sourceMappingURL=Client.d.ts.map
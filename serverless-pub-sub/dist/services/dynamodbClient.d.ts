import DynamoDB, { BatchWriteItemRequestMap } from 'aws-sdk/clients/dynamodb';
import { TopicRow, TopicSubscriptionPayload } from './types';
export interface DynamoTableConfig {
    topicsTable: string;
    eventsTable: string;
}
export declare class DynamoService {
    private readonly tableConfig;
    private readonly client;
    constructor(tableConfig: DynamoTableConfig);
    getTopicsTable(): string;
    getEventsTable(): string;
    getInitialConnectionRecordsForConnectionId(connectionId: string): Promise<DynamoDB.DocumentClient.AttributeMap | undefined>;
    queryTopicsForConnectionId(connectionId: string): Promise<DynamoDB.DocumentClient.ItemList | undefined>;
    querySubscribersForTopic(topic: string): Promise<DynamoDB.DocumentClient.ItemList | undefined>;
    removeItems(RequestItems: BatchWriteItemRequestMap): Promise<void>;
    unsubscribeTopics(topics: TopicRow[]): Promise<void>;
    putSubscriptionForConnectionId(connectionId: string, ttl: number | undefined, { topic, subscriptionId }: TopicSubscriptionPayload): Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
    static beforePublish: (payload: any) => any;
    postMessageToTopic(topic: string, data: any): Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
}
//# sourceMappingURL=dynamodbClient.d.ts.map
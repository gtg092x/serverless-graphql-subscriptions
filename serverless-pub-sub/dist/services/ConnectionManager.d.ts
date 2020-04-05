import { DynamoService } from './dynamodbClient';
import { ConnectionOptions, TopicRow, TopicSubscriptionPayload } from './types';
declare class ConnectionManager {
    private connectionId;
    private gatewayService;
    private dynamoDbService;
    private ttl?;
    constructor(connectionId: string, dynamoDbService: DynamoService, options: ConnectionOptions);
    getConnectionRecords(): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.AttributeMap | undefined>;
    getTopics(): Promise<TopicRow[]>;
    unsubscribe(): Promise<void>;
    sendMessage(message: any): Promise<{
        $response: import("aws-sdk/lib/response").Response<{}, import("aws-sdk/lib/error").AWSError>;
    }>;
    subscribe({ topic, subscriptionId }: TopicSubscriptionPayload): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
    connect(): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
}
export default ConnectionManager;
//# sourceMappingURL=ConnectionManager.d.ts.map
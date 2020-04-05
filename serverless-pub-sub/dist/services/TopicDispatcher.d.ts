import { DynamoService } from './dynamodbClient';
import { ConnectionOptions } from './types';
declare class TopicDispatcher {
    private readonly dynamoDbService;
    private readonly options;
    constructor(dynamoDbService: DynamoService, options: ConnectionOptions);
    getSubscribers(topic: string): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.ItemList>;
    pushMessageToConnectionsForTopic(topic: string, data: any): Promise<(void | {
        $response: import("aws-sdk/lib/response").Response<{}, import("aws-sdk/lib/error").AWSError>;
    })[]>;
    postMessage(topic: string, data: any): Promise<import("aws-sdk/lib/request").PromiseResult<import("aws-sdk/clients/dynamodb").DocumentClient.PutItemOutput, import("aws-sdk/lib/error").AWSError>>;
}
export default TopicDispatcher;
//# sourceMappingURL=TopicDispatcher.d.ts.map
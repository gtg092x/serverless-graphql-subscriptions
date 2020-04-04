import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoPubSubOptions } from './DynamoPubSub';
export declare const createPublishHandler: (clientConfig: DynamoPubSubOptions) => (event: DynamoDBStreamEvent) => Promise<void>;
//# sourceMappingURL=createPublishHandler.d.ts.map
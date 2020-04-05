import { PubSubEngine } from 'graphql-subscriptions';
import { $$asyncIterator } from 'iterall';
import ConnectionManager from './services/ConnectionManager';
import { DynamoTableConfig } from './services/dynamodbClient';
import { ConnectionOptions } from './services/types';
interface IteratorType {
    done: boolean;
    value: any;
}
declare class PubSubAsyncIterator implements AsyncIterator<IteratorType> {
    private readonly pubSub;
    private readonly eventsArray;
    private listening;
    constructor(pubSub: ServerlessPubSub, eventNames?: string[] | string);
    return(): Promise<IteratorType>;
    [$$asyncIterator](): this;
    private subscriptionPromises?;
    subscribeAll(): Promise<(string | number | undefined)[]>;
    next(): Promise<IteratorType>;
}
export declare class ServerlessPubSub extends PubSubEngine {
    private readonly topicDispatcher;
    private readonly dynamoDbService;
    private readonly iterators;
    private readonly options;
    private connectionManager?;
    private subscriptionId?;
    constructor(options: ConnectionOptions & DynamoTableConfig);
    publish(trigger: string, payload: any): Promise<void>;
    pushMessageToConections(trigger: string, payload: any): Promise<void>;
    setConnectionManager(client: ConnectionManager): void;
    setSubscriptionId(subscriptionId: string | number): void;
    getConnectionManager(): ConnectionManager;
    getSubscriptionId(): string | number;
    subscribe(trigger: string): Promise<number>;
    unsubscribe(): Promise<void>;
    createAndSetConnectionManager(connectionId: string): ConnectionManager;
    asyncIterator(triggers: string | string[]): PubSubAsyncIterator;
    storeAllSubscriptions(): Promise<(string | number | undefined)[][]>;
}
export {};
//# sourceMappingURL=ServerlessPubSub.d.ts.map
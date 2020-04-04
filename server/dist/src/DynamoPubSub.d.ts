import { PubSubEngine } from 'graphql-subscriptions';
import { $$asyncIterator } from 'iterall';
import { ConnectionOptions } from './services/ConnectionOptions';
import Client from './services/Client';
interface ReturnResult {
    value: any;
    done: boolean;
}
declare class PubSubAsyncIterator implements AsyncIterator<ReturnResult> {
    private pubsub;
    private pullQueue;
    private pushQueue;
    private listening;
    private eventsArray;
    private subscriptionPromises?;
    constructor(pubsub: DynamoPubSub, eventNames: string | string[]);
    return(): Promise<ReturnResult>;
    [$$asyncIterator](): this;
    pullValue(): Promise<ReturnResult>;
    pushValue(event: any): Promise<void>;
    subscribeAll(): Promise<any[]>;
    next(): Promise<ReturnResult>;
}
export interface DynamoPubSubOptions extends ConnectionOptions {
    ttl: number;
    client?: Client;
    operation: {
        id: any;
    };
}
export declare class DynamoPubSub extends PubSubEngine {
    publish(trigger: string, payload: any): Promise<void>;
    pushMessageToConections(trigger: string, payload: any): Promise<void>;
    static defaultOptions: {
        ttl: number;
        client: undefined;
        operation: {
            id: undefined;
        };
        isOffline: boolean;
        eventsTable: undefined;
        topicsTable: undefined;
    };
    private iterators;
    private options;
    constructor(options?: DynamoPubSubOptions);
    subscribe(trigger: string, onMessage: (event: string) => Promise<void>): Promise<any>;
    unsubscribe(): Promise<any>;
    asyncIterator(triggers: string[] | string): PubSubAsyncIterator;
    flushSubscriptions(): Promise<any[][]>;
    getSubscriber(): Client | undefined;
    getPublisher(): Client | undefined;
    close(): void;
}
export {};
//# sourceMappingURL=DynamoPubSub.d.ts.map
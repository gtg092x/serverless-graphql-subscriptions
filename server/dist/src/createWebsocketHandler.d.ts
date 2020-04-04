import { GraphQLSchema } from 'graphql';
import { DynamoPubSubOptions } from './DynamoPubSub';
export declare const createWebSocketHandler: (schema: GraphQLSchema, config: DynamoPubSubOptions) => (event: any) => Promise<{
    statusCode: number;
    body: string;
}>;
//# sourceMappingURL=createWebsocketHandler.d.ts.map
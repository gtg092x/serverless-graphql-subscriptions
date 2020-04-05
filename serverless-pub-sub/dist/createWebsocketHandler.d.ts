import { GraphQLSchema } from 'graphql';
import { ServerlessPubSub } from './ServerlessPubSub';
export declare const createWebSocketHandler: (schema: GraphQLSchema, options: {
    pubSub: ServerlessPubSub;
    ttl?: number | undefined;
}) => (event: import("aws-lambda").APIGatewayProxyEvent) => Promise<{
    statusCode: number;
    body: string;
}>;
//# sourceMappingURL=createWebsocketHandler.d.ts.map
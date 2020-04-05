"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const DEFAULT_OK = { statusCode: 200, body: '' };
const handleMessage = async (connectionManager, pubSub, schema, operation) => {
    const client = await connectionManager.getConnectionRecords();
    if (!client) {
        throw new Error('Connection records not found');
    }
    const { query: rawQuery, variables, operationName } = operation.payload;
    const graphqlDocument = graphql_1.parse(rawQuery);
    const operationAST = graphql_1.getOperationAST(graphqlDocument, operation.operationName || '');
    if (!operationAST || operationAST.operation !== 'subscription') {
        await connectionManager.sendMessage({
            payload: { message: 'Only subscriptions are supported' },
            type: 'error'
        });
        return DEFAULT_OK;
    }
    const validationErrors = graphql_1.validate(schema, graphqlDocument);
    if (validationErrors.length > 0) {
        await connectionManager.sendMessage({
            payload: { errors: validationErrors },
            type: 'error'
        });
        return DEFAULT_OK;
    }
    pubSub.setSubscriptionId(operation.id);
    try {
        await graphql_1.subscribe({
            document: graphqlDocument,
            schema,
            rootValue: operation,
            operationName: operationName,
            variableValues: variables,
            contextValue: {
                pubSub,
            }
        });
        await pubSub.storeAllSubscriptions();
    }
    catch (err) {
        await connectionManager.sendMessage({
            id: operation.id,
            payload: err,
            type: 'error'
        });
    }
    return DEFAULT_OK;
};
exports.createWebSocketHandler = (schema, options) => async (event) => {
    const { pubSub } = options;
    if (!(event.requestContext && event.requestContext.connectionId)) {
        throw new Error('Invalid event. Missing `connectionId` parameter.');
    }
    const connectionId = event.requestContext.connectionId;
    const route = event.requestContext.routeKey;
    const connectionManager = pubSub.createAndSetConnectionManager(connectionId);
    switch (route) {
        case '$connect':
            await connectionManager.connect();
            return DEFAULT_OK;
        case '$disconnect':
            await connectionManager.unsubscribe();
            return DEFAULT_OK;
        case '$default':
            if (!event.body) {
                return DEFAULT_OK;
            }
            const operation = JSON.parse(event.body);
            switch (operation.type) {
                case 'connection_init': {
                    await connectionManager.sendMessage({ type: 'connection_ack' });
                    return DEFAULT_OK;
                }
                case 'stop': {
                    return DEFAULT_OK;
                }
                default:
                    return handleMessage(connectionManager, pubSub, schema, operation);
            }
        default:
            throw new Error(`Route ${route} is not supported`);
    }
};
//# sourceMappingURL=createWebsocketHandler.js.map
import {parse, getOperationAST, validate, subscribe, GraphQLSchema} from 'graphql'
import ConnectionManager from './services/ConnectionManager';
import {ServerlessPubSub} from './ServerlessPubSub';
import {APIGatewayEvent} from 'aws-lambda';

const DEFAULT_OK = { statusCode: 200, body: '' }

interface WSOperation {
	operationName: string;
	id: string;
	payload: {
		query: any,
		variables: any,
		operationName: string,
	}
}

const handleMessage = async (
	connectionManager: ConnectionManager,
	pubSub: ServerlessPubSub,
	schemaPromise: GraphQLSchema | Promise<GraphQLSchema>,
	operation: WSOperation
) => {
	const schema = await schemaPromise
	const client = await connectionManager.getConnectionRecords()
	if(!client) {
		throw new Error('Connection records not found')
	}

	const { query: rawQuery, variables, operationName } = operation.payload
	const graphqlDocument = parse(rawQuery)
	const operationAST = getOperationAST(graphqlDocument, operation.operationName || '')

	if(!operationAST || operationAST.operation !== 'subscription') {
		await connectionManager.sendMessage({
			payload: { message: 'Only subscriptions are supported' },
			type: 'error'
		})
		return DEFAULT_OK
	}

	const validationErrors = validate(schema, graphqlDocument)
	if(validationErrors.length > 0) {
		await connectionManager.sendMessage({
			payload: { errors: validationErrors },
			type: 'error'
		})
		return DEFAULT_OK
	}

	pubSub.setSubscriptionId(operation.id)

	try {
		await subscribe({
			document: graphqlDocument,
			schema,
			rootValue: operation,
			operationName: operationName,
			variableValues: variables,
			contextValue: {
				pubSub,
			}
		})
		await pubSub.storeAllSubscriptions()
	} catch(err) {
		await connectionManager.sendMessage({
			id: operation.id,
			payload: err,
			type: 'error'
		})
	}
	return DEFAULT_OK
}

export const createWebSocketHandler = (
	schemaPromise: GraphQLSchema | Promise<GraphQLSchema | void>,
	options: { pubSub: ServerlessPubSub, ttl?: number },
) => async (event: APIGatewayEvent) => {
	const schema = await schemaPromise
	if (schema === undefined) {
		throw new Error('Schema not loaded')
	}
	const { pubSub } = options
	if (!(event.requestContext && event.requestContext.connectionId)) {
		throw new Error('Invalid event. Missing `connectionId` parameter.')
	}
	const connectionId = event.requestContext.connectionId
	const route = event.requestContext.routeKey
	const connectionManager = pubSub.createAndSetConnectionManager(connectionId)

	switch (route) {
		case '$connect':
			await connectionManager.connect()
			return DEFAULT_OK
		case '$disconnect':
			await connectionManager.unsubscribe()
			return DEFAULT_OK
		case '$default':
			if (!event.body) {
				return DEFAULT_OK
			}
			const operation = JSON.parse(event.body)
			switch (operation.type) {
				case 'connection_init': {
					await connectionManager.sendMessage({ type: 'connection_ack' })
					return DEFAULT_OK
				}
				case 'stop': {
					return DEFAULT_OK
				}
				default:
					return handleMessage(connectionManager, pubSub, schema, operation)
			}
		default:
			throw new Error(`Route ${route} is not supported`)
	}
}

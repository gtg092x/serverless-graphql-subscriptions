import { parse, getOperationAST, validate, subscribe } from 'graphql'
import ConnectionManager from './services/ConnectionManager'
import { ServerlessPubSub } from './ServerlessPubSub';

const DEFAULT_OK = { statusCode: 200, body: '' }

const handleMessage = async (connectionManager, schema, operation) => {

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

	try {
		const pubSub = new ServerlessPubSub({})
		pubSub.setConnectionManager(connectionManager)
		pubSub.setSubscriptionId(operation.id)
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
		await pubSub.storeAllSubscriptions(connectionManager)
	} catch(err) {
		await connectionManager.sendMessage({
			id: operation.id,
			payload: err,
			type: 'error'
		})
	}
	return DEFAULT_OK
}

export const createWebSocketHandler = (schema, options) => async (event) => {
	if (!(event.requestContext && event.requestContext.connectionId)) {
		throw new Error('Invalid event. Missing `connectionId` parameter.')
	}
	const connectionId = event.requestContext.connectionId
	const route = event.requestContext.routeKey
	const connectionManager = new ConnectionManager(connectionId, {
		ttl: undefined
	})

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
					return handleMessage(connectionManager, schema, operation)
			}
		default:
			throw new Error(`Route ${route} is not supported`)
	}
}

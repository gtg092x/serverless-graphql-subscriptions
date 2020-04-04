import { parse, getOperationAST, validate, subscribe } from 'graphql'
import ConnectionManager from './services/ConnectionManager'
import { ServerlessPubSub } from './ServerlessPubSub';

export const createWebSocketHandler = (schema) => async (event) => {
	if (!(event.requestContext && event.requestContext.connectionId)) {
		throw new Error('Invalid event. Missing `connectionId` parameter.')
	}
	const connectionId = event.requestContext.connectionId
	const route = event.requestContext.routeKey
	const connectionManager = new ConnectionManager(connectionId, {
		ttl: undefined
	})
	const response = { statusCode: 200, body: '' }

	if(route === '$connect') {
		await connectionManager.connect()
		return response
	} else if(route === '$disconnect') {
		await connectionManager.unsubscribe()
		return response
	} else {
		if (!event.body) {
			return response
		}

		let operation = JSON.parse(event.body)

		if(operation.type === 'connection_init') {
			await connectionManager.sendMessage({ type: 'connection_ack' })
			return response
		}

		if(operation.type === 'stop') {
			return response
		}
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
			return response
		}

		const validationErrors = validate(schema, graphqlDocument)
		if(validationErrors.length > 0) {
			await connectionManager.sendMessage({
				payload: { errors: validationErrors },
				type: 'error'
			})
			return response
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
		return response
	}
}

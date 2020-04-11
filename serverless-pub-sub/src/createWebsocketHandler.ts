import {parse, getOperationAST, validate, subscribe, GraphQLSchema} from 'graphql'
import ConnectionManager from './services/ConnectionManager';
import {ServerlessPubSub} from './ServerlessPubSub';
import {APIGatewayEvent} from 'aws-lambda';

const DEFAULT_OK = { statusCode: 200, body: '' }
const DEFAULT_UNAUTHORIZED = { statusCode: 401, body: 'Connection not authorized' }

interface WSOperation {
	operationName: string;
	type: string;
	body: any;
	id: string;
	payload: {
		query: any,
		variables: any,
		operationName: string,
	}
}

const handleMessage = async (
	connectionManager: ConnectionManager,
	options: WsOptions,
	operation: WSOperation
) => {

	if (options.onOperation) {
		const additionalParams = await options.onOperation(
			{
				type: operation ? operation.type : null,
				id: connectionManager.connectionId,
				payload: operation ? operation.payload : null,
			},
			operation.body,
			connectionManager,
		)

		Object.assign(options, additionalParams)
	}

	const schema = options.schema
	const pubSub = options.pubSub

	if (schema === undefined) {
		throw new Error('Schema not loaded')
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
		const initialConnection = await connectionManager.getConnectionRecords()
		let additionalContext = (initialConnection && initialConnection.context)
			? initialConnection.context
			: {}
		if (options.onConnectHydrate) {
			additionalContext = await options.onConnectHydrate(additionalContext)
		}
		await subscribe({
			document: graphqlDocument,
			schema,
			rootValue: operation,
			operationName: operationName,
			variableValues: variables,
			contextValue: {
				...additionalContext,
				pubSub,
			}
		})
		await pubSub.storeAllSubscriptions()
	} catch(err) {
		console.error(err)
		await connectionManager.sendMessage({
			id: operation.id,
			payload: err,
			type: 'error'
		})
	}
	return DEFAULT_OK
}

interface WsOptions {
 	pubSub: ServerlessPubSub;
 	ttl?: number;
 	schema?: GraphQLSchema,
	onConnect?: Function;
	onOperation?: Function;
	onConnectHydrate?: Function;
	context? : any,
	onDisconnect?: Function;
}

async function handleConnection(connectionManager: ConnectionManager) {
	await connectionManager.connect()
	return DEFAULT_OK
}

export const createWebSocketHandler = (
	options: WsOptions,
) => async (event: APIGatewayEvent) => {

	if (!(event.requestContext && event.requestContext.connectionId)) {
		throw new Error('Invalid event. Missing `connectionId` parameter.')
	}

	const {
		pubSub,
	} = options

	const operation = event.body ? JSON.parse(event.body) : null
	const connectionId = event.requestContext.connectionId
	const route = event.requestContext.routeKey
	const connectionManager = pubSub.createAndSetConnectionManager(connectionId)

	switch (route) {
		case '$connect':
			return handleConnection(connectionManager)
		case '$disconnect':
			await connectionManager.unsubscribe()
			if (options.onDisconnect) {
				await options.onDisconnect(connectionManager, {})
			}
			return DEFAULT_OK
		case '$default':
			if (!operation) {
				return DEFAULT_OK
			}

			switch (operation.type) {
				case 'connection_init': {
					const {
						onConnect,
					} = options
					let connectionContext
					if (onConnect) {
						connectionContext = await onConnect(operation.payload, connectionManager, {})
						if (connectionContext === false) {
							await connectionManager.unsubscribe()
							return DEFAULT_UNAUTHORIZED
						}
						await connectionManager.setConnectionContext(
							connectionContext,
						)
					}
					await connectionManager.sendMessage({ type: 'connection_ack' })
					return DEFAULT_OK
				}
				case 'stop': {
					return DEFAULT_OK
				}
				default:
					return handleMessage(connectionManager, options, operation)
			}
		default:
			throw new Error(`Route ${route} is not supported`)
	}
}

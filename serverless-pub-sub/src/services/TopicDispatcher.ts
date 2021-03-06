import ConnectionManager from './ConnectionManager'
import {DynamoService} from './dynamodbClient';
import {ConnectionOptions, IWSOperation} from './types';
import {execute, getOperationAST, GraphQLSchema, parse} from 'graphql';

async function mapDataToPayload(data: any, operation: IWSOperation, schema: GraphQLSchema) {
	const doc = parse(operation.payload.query)
	const ast = getOperationAST(doc, operation.operationName)
	// @ts-ignore
	const command = (
		ast &&
		ast.selectionSet &&
		ast.selectionSet.selections &&
		ast.selectionSet.selections[0] &&
		// @ts-ignore
		ast.selectionSet.selections[0].name &&
		// @ts-ignore
		ast.selectionSet.selections[0].name.value
	)
		// @ts-ignore
		? ast.selectionSet.selections[0].name.value
		: null
	const rootValue = command ? {[command]: data} : data
	const result = await execute({
		document: parse(operation.payload.query),
		operationName: operation.operationName,
		variableValues: operation.payload.variables,
		schema,
		rootValue,
	})

	return result.data
}

class TopicDispatcher {
	private readonly dynamoDbService: DynamoService;
	private readonly options: ConnectionOptions;

	constructor(
		dynamoDbService: DynamoService,
		options: ConnectionOptions
	) {
		this.dynamoDbService = dynamoDbService
		this.options = options
	}

	async getSubscribers(topic: string) {
		const subs = await this
			.dynamoDbService
			.querySubscribersForTopic(topic)
		if (subs === undefined) {
			return []
		}
		return subs
	}

	async pushMessageToConnectionsForTopic(topic: string, data: any, schema: GraphQLSchema) {
		const subscribers = await this.getSubscribers(topic)
		const promises = subscribers.map(async (row) => {
			const { connectionId, subscriptionId, operation } = row
			const topicConnectionManager = new ConnectionManager(
				connectionId,
				this.dynamoDbService,
				this.options,
			)
			try {
				const res = await topicConnectionManager.sendMessage({
					id: subscriptionId,
					payload: { data: await mapDataToPayload(data, operation, schema) },
					type: 'data'
				})
				return res
			} catch(err) {
				console.error(err)
				if(err.statusCode === 410) {
					return topicConnectionManager.unsubscribe()
				}
			}
		})
		return Promise.all(promises)
	}

	async postMessage(topic: string, data: any) {
		return this
			.dynamoDbService
			.postMessageToTopic(topic, data)
	}
}

export default TopicDispatcher

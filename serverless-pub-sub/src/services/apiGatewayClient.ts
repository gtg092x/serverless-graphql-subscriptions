import ApiGatewayManagementApi from 'aws-sdk/clients/apigatewaymanagementapi';

const {
	IS_OFFLINE,
} = process.env

export class ApiGatewayService {
	private gatewayClient: ApiGatewayManagementApi;

	constructor(publishEndpoint?: string) {
		this.gatewayClient = new ApiGatewayManagementApi({
			apiVersion: '2018-11-29',
			endpoint: IS_OFFLINE ? 'http://localhost:3001' : publishEndpoint
		})
	}

	postToConnection(
		connectionId: string,
		message: any
	) {
		return this.gatewayClient.postToConnection({
			ConnectionId: connectionId,
			Data: JSON.stringify(message)
		}).promise()
	}

}

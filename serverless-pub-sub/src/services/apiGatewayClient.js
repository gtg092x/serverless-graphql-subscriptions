import ApiGatewayManagementApi from 'aws-sdk/clients/apigatewaymanagementapi';

const {
	IS_OFFLINE,
} = process.env

export class ApiGatewayService {
	constructor(publishEndpoint) {
		this.gatewayClient = new ApiGatewayManagementApi({
			apiVersion: '2018-11-29',
			endpoint: IS_OFFLINE ? 'http://localhost:3001' : publishEndpoint
		})
	}

	postToConnection(connectionId, message) {
		return this.gatewayClient.postToConnection({
			ConnectionId: connectionId,
			Data: JSON.stringify(message)
		}).promise()
	}

}

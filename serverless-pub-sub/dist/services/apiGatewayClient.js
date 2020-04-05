"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apigatewaymanagementapi_1 = __importDefault(require("aws-sdk/clients/apigatewaymanagementapi"));
const { IS_OFFLINE, } = process.env;
class ApiGatewayService {
    constructor(publishEndpoint) {
        this.gatewayClient = new apigatewaymanagementapi_1.default({
            apiVersion: '2018-11-29',
            endpoint: IS_OFFLINE ? 'http://localhost:3001' : publishEndpoint
        });
    }
    postToConnection(connectionId, message) {
        return this.gatewayClient.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(message)
        }).promise();
    }
}
exports.ApiGatewayService = ApiGatewayService;
//# sourceMappingURL=apiGatewayClient.js.map
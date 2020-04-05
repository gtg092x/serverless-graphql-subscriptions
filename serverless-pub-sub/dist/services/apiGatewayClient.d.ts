export declare class ApiGatewayService {
    private gatewayClient;
    constructor(publishEndpoint?: string);
    postToConnection(connectionId: string, message: any): Promise<{
        $response: import("aws-sdk/lib/response").Response<{}, import("aws-sdk/lib/error").AWSError>;
    }>;
}
//# sourceMappingURL=apiGatewayClient.d.ts.map
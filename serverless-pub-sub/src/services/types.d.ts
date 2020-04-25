export interface IWSPayload {
	query: any,
	variables: any,
	operationName: string,
}

export interface IWSOperation {
	operationName: string;
	type: string;
	body: any;
	id: string;
	payload: IWSPayload;
}

export interface TopicSubscriptionPayload {
	topic: string;
	context?: any,
	subscriptionId?: string | number | undefined;
	operation?: IWSOperation;
}

export interface TopicConextPayload {
	context?: any,
}

export interface TopicRow {
	topic: string;
	connectionId: string;
}

export interface ConnectionOptions {
	ttl?: number;
	publishEndpoint?: string;
}

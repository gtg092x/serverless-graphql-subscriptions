export interface TopicSubscriptionPayload {
	topic: string;
	context?: any,
	subscriptionId?: string | number | undefined;
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

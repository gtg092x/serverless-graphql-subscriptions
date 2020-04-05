export interface TopicSubscriptionPayload {
	topic: string;
	subscriptionId?: string | number | undefined;
}

export interface TopicRow {
	topic: string;
	connectionId: string;
}

export interface ConnectionOptions {
	ttl?: number;
	publishEndpoint?: string;
}

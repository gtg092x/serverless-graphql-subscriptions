import DynamoDB from 'aws-sdk/clients/dynamodb'

const localConfig = {
	region: 'localhost',
	endpoint: 'http://localhost:8000',
	accessKeyId: 'DEFAULT_ACCESS_KEY',
	secretAccessKey: 'DEFAULT_SECRET'
}

const {
	AWS_REGION,
	IS_OFFLINE,
} = process.env

const remoteConfig = {
	region: AWS_REGION
}

const client = new DynamoDB.DocumentClient(IS_OFFLINE ? localConfig : remoteConfig)
export default client

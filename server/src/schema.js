import "reflect-metadata";
// @ts-ignore
import {default as configurePubSub} from './configurePubSub'
import {
	Arg,
	Mutation,
	Resolver,
	PubSub,
	Publisher,
	Subscription,
	buildSchema,
	Query, Ctx
} from 'type-graphql';

@Resolver()
class Root {
	@Mutation(() => String)
	async sendMessage (
		@Arg('message') message: string,
		@PubSub("MY_TOPIC") publish: Publisher<{ listenMessage: string }>,
	) {
		await publish({ listenMessage: message })
		return message
	}

	@Subscription({
		topics: "MY_TOPIC"
	})
	listenMessage(
		root: { listenMessage: string },
		@Ctx() context: any,
	): string {
		console.log('CONTEXT', context)
		return root.listenMessage
	}

	@Query(() => String)
	async _ (): Promise<string> {
		return ""
	}
}

export const pubSub = configurePubSub()

export const createSchema = () => {
	return buildSchema({
		pubSub,
		resolvers: [
			Root,
		]
	})
}

export const schema = createSchema()

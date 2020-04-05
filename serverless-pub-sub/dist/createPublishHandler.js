"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dynamodb_1 = __importDefault(require("aws-sdk/clients/dynamodb"));
const parseNewEvent = dynamodb_1.default.Converter.unmarshall;
const { IS_OFFLINE } = process.env;
exports.createPublishHandler = ({ pubSub }) => async (event) => {
    const subscruptionEvent = event.Records[0];
    if (subscruptionEvent.eventName !== 'INSERT') {
        throw new Error('Invalid event. Wrong dynamodb event type, can publish only `INSERT` events to subscribers.');
    }
    const { topic, data } = IS_OFFLINE ?
        subscruptionEvent.dynamodb.NewImage :
        parseNewEvent(subscruptionEvent.dynamodb.NewImage);
    return pubSub.pushMessageToConections(topic, data);
};
//# sourceMappingURL=createPublishHandler.js.map
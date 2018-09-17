export interface IMessage {
	text: string;
	name: string;
}

export interface ICallback {
	(sender: any, message: IMessage): void;
}

export interface ISubscription {
	isOnce: boolean;
	context: object;
	handler: ICallback;
}

export interface IEventManager {
	cleanup: () => void;
	subscribe: (context: object, handler: ICallback) => IEventManager;
	subscribeOnce: (context: object, handler: ICallback) => object;
	unsubscribe: () => void;
	raise: (sender: object, eventArg?: object) => void;
	hasSubscriber: () => boolean;
	subscriberCount: () => number;
}
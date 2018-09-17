import { IEventManager, ICallback, ISubscription } from "./interfaces";

class EventManager implements IEventManager {
	cleanup: () => void;
	subscribe: (context: object, handler: ICallback) => EventManager;
	subscribeOnce: (context: object, handler: ICallback) => object;
	unsubscribe: () => void;
	raise: (sender: object, eventArg?: object) => void;
	hasSubscriber: () => boolean;
	subscriberCount: () => number;
	
	_unsubscribe: (subscription: ISubscription) => void;
	_subscribe: (isOnce: boolean, context: object, handler: ICallback) => object;
	_subscriptions: ISubscription[]
}

EventManager.prototype._subscriptions = [];

EventManager.prototype.cleanup = function(): void {
	this._subscriptions = [];
};

EventManager.prototype.subscribe = function(context: object, handler: ICallback): EventManager {
	return this._subscribe(false, context, handler);
};

EventManager.prototype.subscribeOnce = function(context: object, handler: ICallback): EventManager {
	return this._subscribe(true, context, handler);
};

EventManager.prototype._subscribe = function(isOnce: boolean, context: object, handler: ICallback): object {
	if(typeof handler !== "function")
		throw new Error("Invalid 'handler' argument.");

	const localSubscription: ISubscription = {
		context,
		handler,
		isOnce
	};
	this._subscriptions.push(localSubscription);
	return {
		unsubscribe: () => {
			this._unsubscribe(localSubscription);
		}
	};
};

EventManager.prototype._unsubscribe = function(subscription: ISubscription): void {
	const index = this._subscriptions.indexOf(subscription);

	if(index >= 0)
		this._subscriptions.splice(index, 1);
};

EventManager.prototype.raise = function(sender: object, eventArg: object): void {
	const unsubscribeList = [];
	for(let i = 0; i < this._subscriptions.length; i++) {
		const subscription: ISubscription = this._subscriptions[i];
		subscription.handler.call(subscription.context, sender, eventArg);
		if(subscription.isOnce)
			unsubscribeList.push(subscription);
	}
	for(let i = 0; i < unsubscribeList.length; i++)
		this._unsubscribe(unsubscribeList[i]);
};

EventManager.prototype.hasSubscriber = function(): boolean {
	return this._subscriptions.length > 0;
};

EventManager.prototype.subscriberCount = function(): number {
	return this._subscriptions.length;
};

export default EventManager;

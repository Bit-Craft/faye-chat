import * as React from "react";
import * as Faye from "faye";

import EventManager from "./EventManager"
import Message from "./Message";

import { ICallback, IEventManager, IMessage } from "./interfaces";

interface IFayeClientProps {
	serverAddress: string;
	options?: object;
}

interface IFayeClientState {
	connected: boolean;
	channelEventManager: {
		[channel: string]: IEventManager
	};
	fayeSubscriptions: {
		[channel: string]: any;
	};
	maxChannelCacheSize: number;
	cache: {
		[channel: string]: IMessage[];
	};
	client: any;
	onConnectEventManager: IEventManager;
	onDisconnectEventManager: IEventManager;
	currentChannel: string;
	messages: IMessage[];
	inputValue: string;
	username: string;
	mutedUsers: string[];
}

export default class FayeClient extends React.Component<IFayeClientProps, IFayeClientState> {
	messageContainer: Element;
	setMessageContainerRef: (element: Element) => void;

	constructor(props: IFayeClientProps) {
		super(props);
		this.state = { 
			connected: false,
			channelEventManager: {},
			onConnectEventManager: new EventManager(),
			onDisconnectEventManager: new EventManager(),
			fayeSubscriptions: {},
			maxChannelCacheSize: 2000,
			cache: {},
			client: new Faye.Client(props.serverAddress, props.options || {}),
			currentChannel: "/CHANNEL_1",
			messages: [],
			inputValue: "",
			username: "",
			mutedUsers: []
		};

		this.messageContainer = null;
		this.setMessageContainerRef = element => { this.messageContainer = element; };
	}

	onChannelMessage(channel: string, message: IMessage, cache: IMessage[]) {
		const { mutedUsers } = this.state;
		if(mutedUsers.indexOf(message.name) > -1)
			return;

		this.state.channelEventManager[channel].raise(null, message);

		cache.push(message);
		while(cache.length > this.state.maxChannelCacheSize)
			cache.shift();

		if(this.state.currentChannel === channel) {
			this.setState({ messages: cache });

			this.messageContainer.scrollTop =this.messageContainer.scrollHeight;
		}
	}

	subscribe(channel: string, callback: ICallback, fetchHistory: boolean) {
		let eventManager = this.state.channelEventManager[channel];
		let needToSubscribe = false;

		if(eventManager === undefined) {
			eventManager = new EventManager();

			this.setState({ channelEventManager: {
				...this.state.channelEventManager,
				[channel]: eventManager
			} });
			
			needToSubscribe = true;
		}

		let cacheMessages = this.state.cache[channel];
		if(cacheMessages === undefined) {
			cacheMessages = [];

			this.setState({ cache: {
				...this.state.cache,
				[channel]: cacheMessages
			} });
		}

		if(fetchHistory)
			if(cacheMessages.length > 0) {
				const copyCache = cacheMessages.slice();
	
				for(let i = 0; i < copyCache.length; i++)
					callback(null, copyCache[i]);
			}

		if(needToSubscribe) {
			const channelSubscription = this.state.client.subscribe(channel, (message: IMessage) => {
				this.onChannelMessage(channel, message, cacheMessages);
			});

			this.setState({
				fayeSubscriptions: {
					...this.state.fayeSubscriptions,
					[channel]: channelSubscription
				}
			})
		}
	}

	unsubscribe(channel: string) {
		const fayeSubscriptions = { ...this.state.fayeSubscriptions };
		const channelEventManager = { ...this.state.channelEventManager };
		
		fayeSubscriptions[channel].cancel();

		delete fayeSubscriptions[channel];
		delete channelEventManager[channel];

		this.setState({
			fayeSubscriptions,
			channelEventManager
		});
	}

	toggleMuted(username: string) {
		const { mutedUsers } = this.state;

		const index = mutedUsers.indexOf(username);

		if(index > -1) {
			const newArray = [...mutedUsers]
			newArray.splice(index, 1);

			this.setState({
				mutedUsers: newArray
			});
		} else
			this.setState({
				mutedUsers: [...mutedUsers, username]
			});
	}

	publish(channel: string, message: IMessage) {
		this.state.client.publish(channel, message);
	};

	onSubmit(event: Event) {
		event.preventDefault();

		const { currentChannel, inputValue, username } = this.state;

		if(!currentChannel || !inputValue || !username)
			return;

		this.publish(currentChannel, { text: inputValue, name: username });

		this.setState({ inputValue: "" });
	}

	componentDidMount() {
		const { client, onConnectEventManager, onDisconnectEventManager } = this.state;

		client.on("transport:up", () => {
			this.setState({ connected: true });
			onConnectEventManager.raise(null);
		});

		client.on("transport:down", () => {
			this.setState({ connected: false });
			onDisconnectEventManager.raise(null);
		});

		client.connect();

		this.subscribe(this.state.currentChannel, (sender: null, message: IMessage) => {
		}, true);
	}

	render() {
		const { messages, mutedUsers } = this.state;

		const users: string[] = [];
		for(const i in messages)
			if(users.indexOf(messages[i].name) === -1)		
				users.push(messages[i].name);

		return (
			<div className="clientContainer">
				<div className="clientContainer__column">
					<ul className="userList">
						<li className="userList__title">
							Active Users:
						</li>

						{ users.map((user: string, index: number) => {
							const color = users.indexOf(user);
							const muted = mutedUsers.indexOf(user) > -1;

							return (
								<li key={ index }
								className={ "userList__user " + "userList__user--color" + (color % 6) }>
									<span className="userList__user__name">
										{ user }
									</span>

									<button className="userList__user__muteButton"
									onClick={ () => this.toggleMuted(user) }>
										{ muted ? "unmute" : "mute" }
									</button>
								</li>);
						} ) }
					</ul>
				</div>

				<div className="clientContainer__column">
					<div className="messageContainer" ref={ element => this.setMessageContainerRef(element) }>
						{ messages.map((message: IMessage, index: number) => {
							if(mutedUsers.indexOf(message.name) > -1)
								return null;
							else
								return <Message key={ index } message={ message } color={ users.indexOf(message.name) }/>;
						}) }
					</div>

					<form onSubmit={ this.onSubmit.bind(this) } className="addMessageForm" autoComplete="off">
						<div className="addMessageForm__row">
							<label className="addMessageForm__row__label">
								Name:
							</label>
							<input name="name" value={ this.state.username } onChange={ event => {
								this.setState({ username: event.target.value });
							} } className="addMessageForm__row__nameInput"/>
						</div>

						<div className="addMessageForm__row">
							<label className="addMessageForm__row__label">
								Message:
							</label>
							<input name="message" value={ this.state.inputValue } onChange={ event => {
								this.setState({ inputValue: event.target.value });
							} } className="addMessageForm__row__messageInput"/>

							<button className="addMessageForm__row__button">
								Add Message
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	}
}
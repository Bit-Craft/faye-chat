import * as React from "react";

import { IMessage } from "./interfaces";

interface IMessageProps {
    message: IMessage;
    color: number;
}

interface IMessageState {
}

export default class Message extends React.Component<IMessageProps, IMessageState> {
    render() {
        const { text, name } = this.props.message;
        const { color } = this.props;

        return (
            <div className={ "message" + " message--color" + (color % 6) }>
                <div className="message__name">
                    { name }
                </div>
                
                <div className="message__text">
                    { text}
                </div>
            </div>
        );
    }
}

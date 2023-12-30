import { ChatService } from "app/services/chat.service";
import { ChannelMember, IChannelMember, SubType } from "./ChannelMember";
import { JoinRequest, MessageRequest, ModeRequest, Modes, PartRequest } from "./ChatQueries";

export enum ChannelType {
    DEFAULT,
    PRIVATE,
    GAME,
    PERSONAL
}


interface IMessage {
    text: string;

    fromId: string;

    fromUsername: string;
}

export interface IChannel {
    id: string;

	name: string;

	avatar: string;

	type: ChannelType;

	hasPassword: boolean;

	users?: IChannelMember[];

	messages?: IMessage[];
}

export class Channel implements IChannel {
    static chatService: ChatService;

    id: string;

    name: string;

	avatar: string;

    type: ChannelType;

    hasPassword: boolean;

    users: ChannelMember[] = [];

    messages: IMessage[] = [];

    notRead: number = 0;

    registered: boolean = false;

    constructor(data: IChannel) {
        this.id = data.id;
        this.name = data.name;
		this.avatar = data.avatar;
        this.type = data.type;
        this.hasPassword = data.hasPassword;

        if (data.users)
            for (const rawMember of data.users)
                this.users.push(new ChannelMember(rawMember));

        if (data.messages)
            this.messages = data.messages;
    }

    message(msg: string) {
        Channel.chatService.sendChatQuery(new MessageRequest(this.id, msg));
    }

    join(passwd?: string) {
        if (!passwd && this.hasPassword)
            throw 'password-needed';
        Channel.chatService.sendChatQuery(new JoinRequest(this.name, passwd));
    }

    leave() {
        Channel.chatService.sendChatQuery(new PartRequest(this.name));
    }
    
    update(channelDto: IChannel) {
        this.name = channelDto.name;
        this.type = channelDto.type;
        this.hasPassword = channelDto.hasPassword;
        this.users = [];
        for (const rawMember of channelDto.users!)
            this.users.push(new ChannelMember(rawMember));
        this.messages = channelDto.messages!;
    }

    isAdmin(userId: string): boolean {
        const user = this.users.find(member =>  userId == member.user_id)
        if (!user)
            return false;
        return (user.subtype == SubType.ADMIN || user.subtype == SubType.OWNER)? true : false;            
    }

    ban(userId: string) {
        Channel.chatService.sendChatQuery(new ModeRequest(this.name, [Modes.BAN, userId]));
    }

    op(userId: string) {
        Channel.chatService.sendChatQuery(new ModeRequest(this.name, [Modes.ADMIN, userId]));
    }

    default(userId: string) {
        Channel.chatService.sendChatQuery(new ModeRequest(this.name, [Modes.DEFAULT, userId]));
    }

    kick(userId: string) {
        Channel.chatService.sendChatQuery(new ModeRequest(this.name, [Modes.KICK, userId]));
    }

    changePassw(passw: string = '') {
        Channel.chatService.sendChatQuery(new ModeRequest(this.name, [Modes.PASSWORD, passw]));
    }

    setPrivate(value: boolean) {
        Channel.chatService.sendChatQuery(new ModeRequest(this.name, [Modes.PRIVATE, value? 'true': 'false']));
    }
}
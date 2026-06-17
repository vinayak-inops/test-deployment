export interface MessageSource {
    title: string;
    uri: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: MessageSource[];
  }
  
  export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }
  

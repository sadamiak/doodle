export type Message = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type RawMessage = {
  _id?: string;
  author?: string;
  message?: string;
  createdAt?: string;
};

export type SendMessageInput = {
  author: string;
  message: string;
};

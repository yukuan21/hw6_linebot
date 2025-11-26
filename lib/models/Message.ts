import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Message 角色類型
export type MessageRole = 'user' | 'assistant' | 'system';

// Message 文件介面
export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  userId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message Schema
const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true, // 為 conversationId 建立索引
    },
    userId: {
      type: String,
      required: true,
      index: true, // 為 userId 建立索引
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true, // 為 timestamp 建立索引
    },
  },
  {
    timestamps: true, // 自動管理 createdAt 和 updatedAt
    collection: 'messages', // 明確指定集合名稱
  }
);

// 建立複合索引：conversationId + timestamp（用於依時間順序查詢對話訊息）
MessageSchema.index({ conversationId: 1, timestamp: 1 });

// 如果 Model 已存在，使用現有 Model；否則建立新 Model
const Message: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema);

export default Message;

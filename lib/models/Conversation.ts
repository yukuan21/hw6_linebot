import mongoose, { Schema, Document, Model } from 'mongoose';

// 功能模式類型
export type ConversationMode = 'popular_destinations' | 'travel_planning' | 'food_recommendation' | null;

// Conversation 文件介面
export interface IConversation extends Document {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  messageCount: number;
  currentMode?: ConversationMode;
}

// Conversation Schema
const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // 為 userId 建立索引以提高查詢效能
    },
    title: {
      type: String,
      default: '',
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    currentMode: {
      type: String,
      enum: ['popular_destinations', 'travel_planning', 'food_recommendation'],
      default: null,
      required: false,
    },
  },
  {
    timestamps: true, // 自動管理 createdAt 和 updatedAt
    collection: 'conversations', // 明確指定集合名稱
  }
);

// 建立索引：userId + updatedAt（用於查詢使用者的最新對話）
ConversationSchema.index({ userId: 1, updatedAt: -1 });

// 如果 Model 已存在，使用現有 Model；否則建立新 Model
const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;

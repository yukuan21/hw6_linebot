import mongoose from 'mongoose';

// MongoDB 連接配置
const MONGODB_URI = process.env.MONGODB_URI || '';

// 驗證環境變數
export function validateMongoDBConfig(): void {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI 環境變數未設定');
  }
}

// 連接狀態管理（用於 Next.js 熱重載環境）
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // 使用 global 確保在熱重載時保持連接狀態
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * 連接 MongoDB 資料庫
 * 使用連接池和快取機制，避免在 Next.js 熱重載時重複連接
 */
export async function connectDB(): Promise<typeof mongoose> {
  // 驗證配置
  validateMongoDBConfig();

  // 如果已經連接，直接返回現有連接
  if (cached.conn) {
    return cached.conn;
  }

  // 如果正在連接，等待連接完成
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB 連接成功');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB 連接失敗:', e);
    throw e;
  }

  return cached.conn;
}

/**
 * 關閉 MongoDB 連接
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB 連接已關閉');
  }
}

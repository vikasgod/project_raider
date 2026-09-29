import mongoose from "mongoose";

type MongooseCache = {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
};

const cached: MongooseCache = global.mongooseConn ?? (global.mongooseConn = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Creating new MongoDB connection");
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/raider";

    console.log("Connecting to MongoDB with URI:", uri);

    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      })
      .then((conn) => {
        console.log("MongoDB connected successfully");
        return conn;
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    const conn = await cached.promise;
    cached.conn = conn;
    return conn;
  } catch (error) {
    cached.promise = null;
    throw new Error(
      `MongoDB connection failed. Check your MONGODB_URI or make sure MongoDB is reachable. Details: ${(error as Error).message}`
    );
  }
}

export default connectDB;
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const connectDB = async () => {
    await mongoose.connect(process.env.NEXT_PUBLIC_MONGO_URI!).then(() => {
        console.log("MongoDb Database Connected");
    })
};

const userSchema = new mongoose.Schema({
    name: String,
    image: String,
    userId: { type: String, unique: true, required: true },
    files: [{
        name: String,
        id: String,
        lock: { type: Boolean, default: false }
    }],
    codes: [{
        name: String,
        id: String,
        lock: { type: Boolean, default: false }
    }],
    notes: [{
        name: String,
        id: String,
        lock: { type: Boolean, default: false }
    }]
});
userSchema.set('timestamps', true);

export async function POST(req: NextRequest) {
    await connectDB();

    const UserModel = mongoose.models.User || mongoose.model('User', userSchema);


    const { user } = await req.json();
    const userId = user.email.split('@')[0].replace('.', '_').replace('/', '_');

    try {
        const existingUser = await UserModel.findOne({ userId });
        if (existingUser) {
            return new Response("User already registered");
        }
        const userInstance = new UserModel({
            name: user.name,
            image: user.image,
            userId
        })
        await userInstance.save();
        return new Response("User created successfully");
    } catch (error) {
        console.log(error)
        return new Response(
            "Internal Sever error :- " + error, {
            status: 500
        })
    }
}
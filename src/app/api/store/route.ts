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

    const UserModel = mongoose.models.User;

    const { userId, name, id, type } = await req.json();
    try {
        const user = await UserModel.find({ userId });
        if (!user) {
            return new Response('user not found')
        }
        const media = await UserModel.find({ userId, [`${type}.id`]: id })
        if (media.length > 0) {
            return new Response('Already added')
        }
        await UserModel.updateOne(
            { userId },
            {
                $push: {
                    [type]: { name, id }
                }
            }
        )
        return new Response("done")
    } catch (error) {
        console.log(error)
        return new Response(
            "Internal Sever error :- " + error, {
            status: 500
        })
    }
}


export async function GET(req: NextRequest) {
    await connectDB();
    const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    try {
        const user: any = await UserModel.find({ userId });
        if (!user) {
            return new Response('user not found', { status: 404 });
        }
        return Response.json({
            files: user[0].files,
            codes: user[0].codes,
            notes: user[0].notes
        });

    } catch (error) {
        console.log(error)
        return new Response(
            "Internal Sever error :- " + error, {
            status: 500
        })
    }
}
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const connectDB = async () => {
    await mongoose.connect(process.env.NEXT_PUBLIC_MONGO_URI!).then(() => {
        console.log("MongoDb Database Connected");
    })
};

const codeSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    value: { type: String, required: true },
    lock: { type: Boolean, default: false }
});

export async function POST(req: NextRequest) {

    const CodeModel = mongoose.models.Code || mongoose.model('Code', codeSchema);
    const NotesModel = mongoose.models.Notes || mongoose.model('Notes', codeSchema);
    const UserModel = mongoose.models.User || mongoose.model('User', codeSchema);
    const { userId, id, status, type } = await req.json();

    try {
        const user = await UserModel.find({ userId });
        if (!user) {
            return new Response('user not found', { status: 404 });
        }
        await UserModel.updateOne(
            { userId, [`${type}.id`]: id },
            {
                $pull: {
                    [type]: { id }
                }
            }
        )

        if (type == 'codes') {
            await CodeModel.deleteOne({ id });
        }

        if (type == 'notes') {
            await NotesModel.deleteOne({ id });
        }

        return new Response('done');
    } catch (error) {
        console.log(error)
        return new Response(
            "Internal Sever error :- " + error, {
            status: 500
        })
    }
}
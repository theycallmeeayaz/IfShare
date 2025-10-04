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
codeSchema.set('timestamps', true);
const NotesModel = mongoose.models.Notes || mongoose.model('Notes', codeSchema);

export async function POST(req: NextRequest) {
    await connectDB();

    const { id, value } = await req.json();
    try {
        await NotesModel.updateOne(
            { id: id },
            { $set: { id, value } },
            { upsert: true }
        );
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
    const { searchParams } = req.nextUrl;
    const data = await NotesModel.findOne({
        id: searchParams.get('id')
    });
    return new Response(JSON.stringify(data))
}
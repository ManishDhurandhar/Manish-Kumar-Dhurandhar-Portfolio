import mongoose from "mongoose";

const ViewSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});
const View = mongoose.models.View || mongoose.model("View", ViewSchema);

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) return;
  try {
    await mongoose.connect(uri);
    isConnected = true;
  } catch (err) {
    console.error(err);
  }
}

export default async function handler(req: any, res: any) {
  await connectDB();
  if (!isConnected) return res.status(200).json({ count: 1337 });
  try {
    const view = await (View as any).findOneAndUpdate({}, { $inc: { count: 1 } }, { upsert: true, new: true }).lean();
    res.status(200).json({ count: (view as any)?.count || 1 });
  } catch (err) {
    res.status(500).json({ error: "Failed to update views" });
  }
}

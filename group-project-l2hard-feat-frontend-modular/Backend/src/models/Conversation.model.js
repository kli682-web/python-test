import mongoose from "mongoose";

const { Schema, model } = mongoose;

const conversationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        preferenceType: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

conversationSchema.index({ userId: 1, createdAt: -1 });

const Conversation = model("Conversation", conversationSchema);

export default Conversation;
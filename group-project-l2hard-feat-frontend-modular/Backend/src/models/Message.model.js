import mongoose from "mongoose";

const { Schema, model } = mongoose;

const messageSchema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        senderType: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ text: "text" });

const Message = model("Message", messageSchema);

export default Message;
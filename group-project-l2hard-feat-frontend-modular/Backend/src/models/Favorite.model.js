import mongoose from "mongoose";

const { Schema, model } = mongoose;

const favoriteSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        savedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

favoriteSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, savedAt: -1 });

const Favorite = model("Favorite", favoriteSchema);

export default Favorite;
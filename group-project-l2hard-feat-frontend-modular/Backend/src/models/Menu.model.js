import mongoose from "mongoose";

const { Schema, model } = mongoose;

const menuSchema = new Schema(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

menuSchema.index({ restaurantId: 1 });
menuSchema.index({ category: 1, price: 1 });
menuSchema.index({ restaurantId: 1, name: 1 });

const Menu = model("Menu", menuSchema);

export default Menu;
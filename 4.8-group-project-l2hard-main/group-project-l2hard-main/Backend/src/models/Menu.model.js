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
        },
        normalizedCategory: {
            type: String,
            default: null,
            trim: true
        },
        primaryDishType: {
            type: String,
            default: null,
            trim: true
        },
        dishTypes: {
            type: [String],
            default: []
        },
        proteinTags: {
            type: [String],
            default: []
        },
        cuisineTags: {
            type: [String],
            default: []
        },
        mealTags: {
            type: [String],
            default: []
        },
        isMainDish: {
            type: Boolean,
            default: false
        },
        isSide: {
            type: Boolean,
            default: false
        },
        isAddon: {
            type: Boolean,
            default: false
        },
        isCombo: {
            type: Boolean,
            default: false
        },
        includesDrink: {
            type: Boolean,
            default: false
        },
        supportsFoodIntent: {
            type: Boolean,
            default: true
        },
        supportsDrinkIntent: {
            type: Boolean,
            default: false
        },
        containsSalad: {
            type: Boolean,
            default: false
        },
        containsNoodles: {
            type: Boolean,
            default: false
        },
        nameTokens: {
            type: [String],
            default: []
        },
        searchText: {
            type: String,
            default: ''
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
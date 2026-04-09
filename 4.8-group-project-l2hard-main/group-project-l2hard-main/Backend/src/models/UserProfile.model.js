import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userProfileSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        preferredCuisine: [
            {
                type: String,
                trim: true
            }
        ],
        defaultBudget: {
            type: Number,
            default: 20,
            min: 0
        },
        defaultDistance: {
            type: Number,
            default: 1,
            min: 0
        },
        favoriteFoodCategories: [
            {
                type: String,
                trim: true
            }
        ],
        resetToDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

userProfileSchema.index({ userId: 1 }, { unique: true });
userProfileSchema.index({ preferredCuisine: 1 });

const UserProfile = model("UserProfile", userProfileSchema);

export default UserProfile;
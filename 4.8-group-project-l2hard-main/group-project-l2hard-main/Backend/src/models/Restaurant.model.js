import mongoose from "mongoose";

const { Schema, model } = mongoose;

const openingHourSchema = new Schema(
    {
        day: {
            type: String,
            enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            required: true
        },
        open: {
            type: String,
            default: ""
        },
        close: {
            type: String,
            default: ""
        }
    },
    { _id: false }
);

const pointSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function (value) {
                    return Array.isArray(value) && value.length === 2;
                },
                message: "Coordinates must be [longitude, latitude]"
            }
        }
    },
    { _id: false }
);

const restaurantSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        location: {
            address: {
                type: String,
                required: true,
                trim: true
            },
            geo: {
                type: pointSchema,
                required: true
            },
            distanceFromCampus: {
                type: Number,
                required: true,
                min: 0
            },
            googleMapsUrl: {
                type: String,
                required: true,
                trim: true
            }
        },
        cuisineTypes: [
            {
                type: String,
                required: true,
                trim: true
            }
        ],
        priceRange: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low"
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        openingHours: [openingHourSchema],
        isCampusVendor: {
            type: Boolean,
            default: false
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        derivedCuisineTypes: {
            type: [String],
            default: []
        },
        derivedFoodTypes: {
            type: [String],
            default: []
        },
        supportsFood: {
            type: Boolean,
            default: true
        },
        supportsDrink: {
            type: Boolean,
            default: false
        },
        menuCategorySummary: {
            type: [String],
            default: []
        },
        menuProteinSummary: {
            type: [String],
            default: []
        },
        menuDishTypeSummary: {
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

restaurantSchema.index({ "location.geo": "2dsphere" });
restaurantSchema.index({ cuisineTypes: 1, priceRange: 1 });
restaurantSchema.index({ rating: -1, "location.distanceFromCampus": 1 });


const Restaurant = model("Restaurant", restaurantSchema);

export default Restaurant;
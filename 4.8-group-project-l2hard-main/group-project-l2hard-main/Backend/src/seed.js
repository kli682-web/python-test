//it's just for demo data, will be deleted later, so we can use hardcoded data and simple logic to insert data into the database. No need to use faker or other libraries for generating random data.

import "dotenv/config";
import connectDB from "./config/db.js";
import {
    User,
    UserProfile,
    Restaurant,
    Menu,
    Favorite,
    Conversation,
    Message
} from "./models/index.js";

async function seed() {
    try {
        await connectDB();

        await User.deleteMany({});
        await UserProfile.deleteMany({});
        await Restaurant.deleteMany({});
        await Menu.deleteMany({});
        await Favorite.deleteMany({});
        await Conversation.deleteMany({});
        await Message.deleteMany({});

        const user = await User.create({
            username: "alan",
            email: "alan@example.com",
            password: "12345678",
            role: "user"
        });

        await UserProfile.create({
            userId: user._id,
            preferredCuisine: ["chinese", "japanese"],
            defaultBudget: 20,
            defaultDistance: 2,
            favoriteFoodCategories: ["spicy", "sweet"]
        });

        const restaurant = await Restaurant.create({
            name: "Campus Noodle House",
            location: {
                address: "1 University Road, Auckland",
                geo: {
                    type: "Point",
                    coordinates: [174.7633, -36.8485]
                },
                distanceFromCampus: 0.4,
                googleMapsUrl: "https://maps.google.com"
            },
            cuisineTypes: ["chinese", "asian"],
            priceRange: "low",
            rating: 4.5,
            openingHours: [
                { day: "Mon", open: "09:00", close: "18:00" },
                { day: "Tue", open: "09:00", close: "18:00" }
            ],
            isCampusVendor: true,
            isAvailable: true
        });

        const menu = await Menu.create({
            restaurantId: restaurant._id,
            name: "Spicy Beef Noodles",
            category: "spicy",
            price: 15.5,
            rating: 4.7,
            isAvailable: true,
            prepTime: 10
        });

        await Favorite.create({
            userId: user._id,
            restaurantId: restaurant._id
        });

        const conversation = await Conversation.create({
            userId: user._id,
            preferenceType: "budget+spicy+near"
        });

        await Message.create([
            {
                conversationId: conversation._id,
                senderType: "user",
                text: "I want something cheap and spicy near campus."
            },
            {
                conversationId: conversation._id,
                senderType: "assistant",
                text: "You can try Campus Noodle House. It is cheap and close to campus."
            }
        ]);

        console.log("Seed data inserted successfully");
        console.log({
            user,
            restaurant,
            menu,
            conversation
        });

        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
}

seed();
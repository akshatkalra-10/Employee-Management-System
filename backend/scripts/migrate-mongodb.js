require("dotenv").config();
const { MongoClient } = require("mongodb");

function getDbNameFromUri(uri) {
    try {
        const parsed = new URL(uri);
        const path = (parsed.pathname || "").replace(/^\//, "");
        return path ? decodeURIComponent(path) : "test";
    } catch {
        return "test";
    }
}

function buildIndexOptions(index) {
    const options = {};
    const ignoredFields = new Set(["key", "name", "ns", "v", "background"]);

    for (const [key, value] of Object.entries(index)) {
        if (!ignoredFields.has(key)) {
            options[key] = value;
        }
    }

    return options;
}

async function migrateCollections() {
    const oldUri = process.env.OLD_MONGODB_URI;
    const newUri = process.env.MONGODB_URI;

    if (!oldUri) {
        throw new Error("OLD_MONGODB_URI is missing in .env");
    }

    if (!newUri) {
        throw new Error("MONGODB_URI is missing in .env");
    }

    const oldDbName = process.env.OLD_DB_NAME || getDbNameFromUri(oldUri);
    const newDbName = process.env.NEW_DB_NAME || getDbNameFromUri(newUri);

    const oldClient = new MongoClient(oldUri);
    const newClient = new MongoClient(newUri);

    await oldClient.connect();
    await newClient.connect();

    try {
        const oldDb = oldClient.db(oldDbName);
        const newDb = newClient.db(newDbName);

        const collections = await oldDb.listCollections({}, { nameOnly: true }).toArray();
        const userCollections = collections
            .map((c) => c.name)
            .filter((name) => !name.startsWith("system."));

        if (userCollections.length === 0) {
            console.log(`No collections found in source DB '${oldDbName}'.`);
            return;
        }

        console.log(`Migrating ${userCollections.length} collection(s) from '${oldDbName}' to '${newDbName}'...`);

        for (const name of userCollections) {
            const sourceCollection = oldDb.collection(name);
            const targetCollection = newDb.collection(name);

            const docs = await sourceCollection.find({}).toArray();
            const indexes = await sourceCollection.indexes();

            try {
                await targetCollection.drop();
            } catch (error) {
                if (error.codeName !== "NamespaceNotFound") {
                    throw error;
                }
            }

            if (docs.length > 0) {
                await targetCollection.insertMany(docs, { ordered: false });
            } else {
                await newDb.createCollection(name);
            }

            const customIndexes = indexes.filter((index) => index.name !== "_id_");
            for (const index of customIndexes) {
                await targetCollection.createIndex(index.key, {
                    name: index.name,
                    ...buildIndexOptions(index)
                });
            }

            console.log(`- ${name}: ${docs.length} document(s) migrated`);
        }

        console.log("Migration completed successfully.");
    } finally {
        await oldClient.close();
        await newClient.close();
    }
}

migrateCollections().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});

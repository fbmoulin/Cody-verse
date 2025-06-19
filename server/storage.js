const { replitUsers } = require("../shared/schema.js");
const { db } = require("./db.js");
const { eq } = require("drizzle-orm");

// Interface for storage operations
class DatabaseStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id) {
    try {
      const [user] = await db.select().from(replitUsers).where(eq(replitUsers.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async upsertUser(userData) {
    try {
      const [user] = await db
        .insert(replitUsers)
        .values(userData)
        .onConflictDoUpdate({
          target: replitUsers.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }
}

const storage = new DatabaseStorage();
module.exports = { storage };
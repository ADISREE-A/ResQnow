// Seed script to hash existing passwords and create admin user
// Run with: node backend/seedPasswords.js

const bcrypt = require("bcryptjs");
const db = require("./config/db");

const SALT_ROUNDS = 10;

async function seedPasswords() {
  console.log("Starting password seeding...\n");

  try {
    // 1. Hash admin password and create admin user
    const adminPassword = "admin123";
    const adminHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    
    // Check if admin exists
    const [existingAdmin] = await db.promise().query(
      "SELECT id FROM users WHERE username = 'admin'"
    );

    if (existingAdmin.length > 0) {
      // Update existing admin
      await db.promise().query(
        "UPDATE users SET password_hash = ? WHERE username = 'admin'",
        [adminHash]
      );
      console.log("✅ Admin password updated");
    } else {
      // Insert new admin
      await db.promise().query(
        "INSERT INTO users (username, email, password_hash, role, is_active, is_verified) VALUES (?, ?, ?, ?, ?, ?)",
        ['admin', 'admin@resqnow.com', adminHash, 'admin', true, true]
      );
      console.log("✅ Admin user created");
    }

    // 2. Hash police passwords for existing officers
    const [officers] = await db.promise().query("SELECT id, badge_number, password_hash FROM officers");
    
    for (const officer of officers) {
      // Only hash if it's still plain text
      if (officer.password_hash && !officer.password_hash.startsWith('$2a$')) {
        const newHash = await bcrypt.hash(officer.password_hash, SALT_ROUNDS);
        await db.promise().query(
          "UPDATE officers SET password_hash = ? WHERE id = ?",
          [newHash, officer.id]
        );
        console.log(`✅ Officer ${officer.badge_number} password hashed`);
      }
    }

    console.log("\n🎉 Password seeding completed!");
    console.log("\n📝 Login credentials:");
    console.log("   Admin: username='admin', password='admin123'");
    console.log("   Police: Use badge number (e.g., OFF001) with password='police123'");

  } catch (error) {
    console.error("❌ Error seeding passwords:", error);
  }

  process.exit(0);
}

seedPasswords();


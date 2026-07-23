import bcrypt from "bcryptjs";
import db from "./db.js";

// Clean up guest and trial accounts older than 24 hours
export const cleanupExpiredAccounts = async () => {
  try {
    // 1. Delete guest accounts older than 24 hours
    // cascade constraint deletes all their workspaces, records, and subscriptions automatically.
    const guestDeleteResult = await db.query(`
      DELETE FROM users 
      WHERE email LIKE 'guest_%@dataforge.com' 
        AND created_at < NOW() - INTERVAL '1 day'
      RETURNING id, full_name, email
    `);
    if (guestDeleteResult.rows.length > 0) {
      console.log(`Cleaned up ${guestDeleteResult.rows.length} expired guest accounts.`);
    }

    // 2. Delete trial accounts that are expired for more than 24 hours
    const trialDeleteResult = await db.query(`
      DELETE FROM users 
      WHERE id IN (
        SELECT s.user_id 
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE p.name IN ('pro', 'team')
          AND s.current_period_end < NOW() - INTERVAL '1 day'
      )
      RETURNING id, full_name, email
    `);
    if (trialDeleteResult.rows.length > 0) {
      console.log(`Cleaned up ${trialDeleteResult.rows.length} expired trial accounts.`);
    }
  } catch (err) {
    console.error("Error during expired accounts cleanup:", err);
  }
};

export const initDb = async () => {
  console.log("Verifying database schema...");
  try {
    // Enable UUID extension
    await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'team_leader', 'user')),
          manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Workspaces Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          config JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Workspace Members Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS workspace_members (
          workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(20) DEFAULT 'editor',
          PRIMARY KEY (workspace_id, user_id)
      );
    `);

    // 4. Records Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
          data JSONB NOT NULL,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Plans Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(50) NOT NULL UNIQUE,
          limits JSONB NOT NULL
      );
    `);

    // 6. Subscriptions Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          plan_id UUID REFERENCES plans(id),
          status VARCHAR(20) DEFAULT 'inactive',
          current_period_end TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create Active Sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token_id UUID NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create Activity Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(100) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Create Indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_records_workspace_id ON records (workspace_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces (owner_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members (user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions (user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id ON activity_logs (workspace_id);`);

    // 8. Alter constraints to support ON DELETE SET NULL for manager and creator references
    await db.query(`
      ALTER TABLE records 
      DROP CONSTRAINT IF EXISTS records_created_by_fkey,
      ADD CONSTRAINT records_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    `);

    await db.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_manager_id_fkey,
      ADD CONSTRAINT users_manager_id_fkey 
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
    `);

    // Seed default plans if empty
    const planCheck = await db.query("SELECT COUNT(*) FROM plans");
    if (parseInt(planCheck.rows[0].count, 10) === 0) {
      console.log("Seeding default plans...");
      await db.query(`
        INSERT INTO plans (name, limits) VALUES 
        ('free', '{"max_workspaces": 2, "max_records_per_workspace": 50, "max_seats_per_workspace": 0}'),
        ('pro', '{"max_workspaces": 9999, "max_records_per_workspace": 99999, "max_seats_per_workspace": 0}'),
        ('team', '{"max_workspaces": 9999, "max_records_per_workspace": 99999, "max_seats_per_workspace": 10}');
      `);
      console.log("Plans seeded successfully!");
    }

    // Seed test users if empty
    const userCheck = await db.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      console.log("Seeding test users...");
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("Password@123", salt);

      // Fetch plan IDs
      const plansResult = await db.query("SELECT id, name FROM plans");
      const planIds = {};
      plansResult.rows.forEach(p => {
        planIds[p.name] = p.id;
      });

      // 1. Admin
      const adminResult = await db.query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Admin Test", "admin@dataforge.com", passwordHash, "admin"]
      );
      const adminId = adminResult.rows[0].id;
      await db.query(
        "INSERT INTO subscriptions (user_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, $4)",
        [adminId, planIds["pro"], "active", new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)]
      );

      // 2. Team Leader
      const leaderResult = await db.query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Leader Test", "leader@dataforge.com", passwordHash, "team_leader"]
      );
      const leaderId = leaderResult.rows[0].id;
      await db.query(
        "INSERT INTO subscriptions (user_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, $4)",
        [leaderId, planIds["team"], "active", new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)]
      );

      // 3. Three Team Members managed by Team Leader
      for (let i = 1; i <= 3; i++) {
        const memberResult = await db.query(
          "INSERT INTO users (full_name, email, password_hash, role, manager_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [`Member ${i}`, `member${i}@dataforge.com`, passwordHash, "user", leaderId]
        );
        const memberId = memberResult.rows[0].id;
        await db.query(
          "INSERT INTO subscriptions (user_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, $4)",
          [memberId, planIds["team"], "active", new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)]
        );
      }

      // 4. Individual standard user
      const userResult = await db.query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Individual User", "user@dataforge.com", passwordHash, "user"]
      );
      const userId = userResult.rows[0].id;
      await db.query(
        "INSERT INTO subscriptions (user_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, $4)",
        [userId, planIds["free"], "active", new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)]
      );

      console.log("Seeding test users and subscriptions completed!");
    }

    // Run clean up routine on boot
    await cleanupExpiredAccounts();

    console.log("Database schema verification completed successfully!");
  } catch (err) {
    console.error("Error during database schema verification:", err);
  }
};

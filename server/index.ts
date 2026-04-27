import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// MySQL Database connection setup
const dbConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'pawconnect',
  port: process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT) : 3306,
  timezone: 'Z'
};

const JWT_SECRET = process.env.JWT_SECRET || 'pawconnect_secret_key_change_me_in_production';

// Create a connection pool
let pool: mysql.Pool | null = null;
try {
  pool = mysql.createPool(dbConfig);
  // Test connection immediately
  pool.getConnection()
    .then(conn => {
      console.log("✅ Successfully connected to MySQL at", dbConfig.host);
      conn.release();
    })
    .catch(err => {
      console.error("❌ Database connection failed! Check your Railway Environment Variables.");
      console.error("Error details:", err.message);
    });
  
  pool.on('acquire', (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });
  console.log("MySQL Database pool created.");
} catch (error) {
  console.error("Failed to create MySQL connection pool:", error);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // API Routes
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", message: "PawConnect Backend is running" });
  });

  // Create a Case (Report Lost/Found)
  app.post("/api/cases", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    
    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { 
      type, petName, species, breed, gender, age, color, marks, 
      location, date, time, description, reward, condition, photos 
    } = req.body;

    console.log("Creating case for user:", decoded.userId, "Type:", type);

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Ensure user is in Reporter table
      const [reporters]: any = await connection.query("SELECT reporter_id FROM Reporter WHERE user_id = ?", [decoded.userId]);
      let reporterId;
      if (reporters.length === 0) {
        const [repResult]: any = await connection.query("INSERT INTO Reporter (user_id) VALUES (?)", [decoded.userId]);
        reporterId = repResult.insertId;
      } else {
        reporterId = reporters[0].reporter_id;
      }

      // 2. Create Location
      const locStr = String(location || "Unknown");
      const [locResult]: any = await connection.query(
        "INSERT INTO Location (city, area) VALUES (?, ?)", 
        [locStr.split(',')[0].trim() || "Unknown", locStr]
      );
      const locationId = locResult.insertId;

      // 3. Create PetProfile
      const [petResult]: any = await connection.query(
        "INSERT INTO PetProfile (species, breed, age, gender, color, distinguishing_marks) VALUES (?, ?, ?, ?, ?, ?)",
        [species || "Unknown", breed || "Unknown", age || null, (gender || 'UNKNOWN').toUpperCase(), color || "Unknown", marks || null]
      );
      const petId = petResult.insertId;

      // 4. Create CaseTable
      const [caseResult]: any = await connection.query(
        "INSERT INTO CaseTable (reporter_id, location_id, pet_id, case_type, description) VALUES (?, ?, ?, ?, ?)",
        [reporterId, locationId, petId, (type || 'LOST').toUpperCase(), description || null]
      );
      const caseId = caseResult.insertId;

      // 5. Add Case Photos (Incident-specific)
      if (Array.isArray(photos) && photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          await connection.query(
            "INSERT INTO CasePhoto (case_id, photo_url, is_primary) VALUES (?, ?, ?)",
            [caseId, photos[i], i === 0]
          );
        }
      }

      // 6. Create specific Report entry
      const dateTime = `${date || new Date().toISOString().split('T')[0]} ${time || '00:00'}:00`;
      if (String(type).toLowerCase() === 'found') {
        await connection.query(
          "INSERT INTO FoundReport (case_id, date_time, found_condition) VALUES (?, ?, ?)",
          [caseId, dateTime, condition || 'Good']
        );
      } else {
        await connection.query(
          "INSERT INTO LostReport (case_id, date_time, reward) VALUES (?, ?, ?)",
          [caseId, dateTime, reward || 0]
        );
      }

      await connection.commit();
      console.log("Case created successfully:", caseId);

      // --- ADVANCED ASYNC MATCHING ENGINE ---
      try {
        const otherType = String(type).toLowerCase() === 'lost' ? 'FOUND' : 'LOST';
        const currentCity = locStr.split(',')[0].trim();
        
        const [potentialMatches]: any = await pool.query(
          `SELECT c.case_id, r.user_id, p.breed, p.gender, l.city, p.color
           FROM CaseTable c 
           JOIN PetProfile p ON c.pet_id = p.pet_id 
           JOIN Reporter r ON c.reporter_id = r.reporter_id
           JOIN Location l ON c.location_id = l.location_id
           WHERE c.case_type = ? 
           AND p.species = ? 
           AND c.status = 'REPORTED'
           AND LOWER(l.city) = LOWER(?)
           AND (p.gender = ? OR p.gender = 'UNKNOWN' OR ? = 'UNKNOWN')
           AND (p.breed IS NULL OR ? IS NULL OR p.breed LIKE ? OR ? LIKE CONCAT('%', p.breed, '%'))
           AND (p.color IS NULL OR ? IS NULL OR p.color LIKE ? OR ? LIKE CONCAT('%', p.color, '%'))`,
          [
            otherType, species, currentCity, 
            gender, gender, 
            breed, `%${breed}%`, breed,
            color, `%${color}%`, color
          ]
        );

        if (potentialMatches.length > 0) {
          for (const match of potentialMatches) {
             const [lostRows]: any = await pool.query("SELECT lost_report_id FROM LostReport WHERE case_id = ?", [String(type).toLowerCase() === 'lost' ? caseId : match.case_id]);
             const [foundRows]: any = await pool.query("SELECT found_report_id FROM FoundReport WHERE case_id = ?", [String(type).toLowerCase() === 'found' ? caseId : match.case_id]);

             if (lostRows.length > 0 && foundRows.length > 0) {
               const lost_report_id = lostRows[0].lost_report_id;
               const found_report_id = foundRows[0].found_report_id;
               
               const [existing]: any = await pool.query(
                 "SELECT * FROM Matches WHERE lost_report_id = ? AND found_report_id = ?",
                 [lost_report_id, found_report_id]
               );
               
               if (existing.length === 0) {
                 await pool.query(
                   "INSERT INTO Matches (lost_report_id, found_report_id, match_score) VALUES (?, ?, ?)",
                   [lost_report_id, found_report_id, 0.85]
                 );
               }
             }

             // 2. Create notification for the existing case owner
             await pool.query(
               "INSERT INTO Notification (user_id, message, created_at) VALUES (?, ?, UTC_TIMESTAMP())",
               [match.user_id, `Match Alert: A ${species} ${breed || ''} was just reported in ${currentCity}.`]
             );
          }
          // 3. Create notification for the new reporter
          await pool.query(
            "INSERT INTO Notification (user_id, message, created_at) VALUES (?, ?, UTC_TIMESTAMP())",
            [decoded.userId, `Success! We found ${potentialMatches.length} highly relevant matches in ${currentCity}. Check the Matches tab.`]
          );
        }
      } catch (matchErr) {
        console.error("Matching engine error:", matchErr);
      }

      res.status(201).json({ message: "Report submitted successfully", caseId });
    } catch (err: any) {
      if (connection) await connection.rollback();
      console.error("Report transaction error:", err);
      res.status(500).json({ error: "Failed to submit report", details: err.message });
    } finally {
      if (connection) connection.release();
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const { id } = req.params;
    try {
      await pool.query("UPDATE Notification SET is_read = 1 WHERE notification_id = ?", [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const [rows]: any = await pool.query("SELECT COUNT(*) as count FROM Notification WHERE user_id = ? AND is_read = 0", [decoded.userId]);
      res.json({ count: rows[0].count });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get all cases (for Dashboard)
  app.get("/api/cases", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    
    const { species, type, city } = req.query;
    let query = `
      SELECT c.*, p.species, p.breed, p.color, l.city, l.area, ph.photo_url 
      FROM CaseTable c
      JOIN PetProfile p ON c.pet_id = p.pet_id
      JOIN Location l ON c.location_id = l.location_id
      LEFT JOIN CasePhoto ph ON c.case_id = ph.case_id AND ph.is_primary = 1
      WHERE 1=1
    `;
    const params = [];

    if (species) { query += " AND p.species = ?"; params.push(species); }
    if (type) { query += " AND c.case_type = ?"; params.push(type.toString().toUpperCase()); }
    if (city) { query += " AND l.city = ?"; params.push(city); }

    query += " ORDER BY c.report_date DESC";

    try {
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch cases", details: err.message });
    }
  });

  // Get user-specific cases
  app.get("/api/my-cases", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const query = `
        SELECT c.*, p.species, p.breed, p.color, p.gender, p.age, l.city, l.area, ph.photo_url 
        FROM CaseTable c
        JOIN Reporter r ON c.reporter_id = r.reporter_id
        JOIN PetProfile p ON c.pet_id = p.pet_id
        JOIN Location l ON c.location_id = l.location_id
        LEFT JOIN CasePhoto ph ON c.case_id = ph.case_id AND ph.is_primary = 1
        WHERE r.user_id = ?
        ORDER BY c.report_date DESC
      `;
      const [rows] = await pool.query(query, [decoded.userId]);
      res.json(rows);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Update case status
  app.put("/api/cases/:id/status", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { status } = req.body;

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      // Verify ownership
      const [reporter]: any = await pool.query("SELECT reporter_id FROM Reporter WHERE user_id = ?", [decoded.userId]);
      if (reporter.length === 0) return res.status(403).json({ error: "Reporter profile not found" });

      const [updateResult]: any = await pool.query(
        "UPDATE CaseTable SET status = ? WHERE case_id = ? AND reporter_id = ?",
        [status, req.params.id, reporter[0].reporter_id]
      );

      if (updateResult.affectedRows === 0) return res.status(404).json({ error: "Case not found or unauthorized" });
      res.json({ message: "Status updated successfully" });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get single case for editing
  app.get("/api/cases/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const query = `
        SELECT c.*, p.*, l.city, l.area, ph.photo_url, lr.reward, fr.found_condition 
        FROM CaseTable c
        JOIN PetProfile p ON c.pet_id = p.pet_id
        JOIN Location l ON c.location_id = l.location_id
        LEFT JOIN CasePhoto ph ON c.case_id = ph.case_id AND ph.is_primary = 1
        LEFT JOIN LostReport lr ON c.case_id = lr.case_id
        LEFT JOIN FoundReport fr ON c.case_id = fr.case_id
        JOIN Reporter r ON c.reporter_id = r.reporter_id
        WHERE c.case_id = ? AND r.user_id = ?
      `;
      const [rows]: any = await pool.query(query, [req.params.id, decoded.userId]);
      if (rows.length === 0) return res.status(404).json({ error: "Case not found or unauthorized" });
      
      // Get all photos
      const [photos]: any = await pool.query("SELECT photo_url FROM CasePhoto WHERE case_id = ?", [req.params.id]);
      res.json({ ...rows[0], photos: photos.map((p: any) => p.photo_url) });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Update full case
  app.put("/api/cases/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { 
      petName, species, breed, gender, age, color, marks, 
      location, date, time, description, reward, condition, photos 
    } = req.body;

    let connection;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Verify ownership
      const [reporters]: any = await connection.query("SELECT reporter_id FROM Reporter WHERE user_id = ?", [decoded.userId]);
      if (reporters.length === 0) throw new Error("Reporter profile not found");

      const [caseRows]: any = await connection.query(
        "SELECT pet_id, location_id FROM CaseTable WHERE case_id = ? AND reporter_id = ?", 
        [req.params.id, reporters[0].reporter_id]
      );
      if (caseRows.length === 0) throw new Error("Case not found or unauthorized");

      const { pet_id, location_id } = caseRows[0];

      // 2. Update Location
      await connection.query("UPDATE Location SET city = ?, area = ? WHERE location_id = ?", [location, location, location_id]);

      // 3. Update PetProfile
      await connection.query(
        "UPDATE PetProfile SET species = ?, breed = ?, gender = ?, age = ?, color = ?, distinguishing_marks = ? WHERE pet_id = ?",
        [species, breed, (gender || 'UNKNOWN').toUpperCase(), age || null, color, marks, pet_id]
      );

      // 4. Update CaseTable
      const dateTime = `${date} ${time || '00:00'}:00`;
      await connection.query(
        "UPDATE CaseTable SET report_date = ?, description = ? WHERE case_id = ?",
        [dateTime, description, req.params.id]
      );

      // 5. Update specific Report entry (Lost/Found)
      const [lostRows]: any = await connection.query("SELECT * FROM LostReport WHERE case_id = ?", [req.params.id]);
      if (lostRows.length > 0) {
        await connection.query("UPDATE LostReport SET date_time = ?, reward = ? WHERE case_id = ?", [dateTime, reward || 0, req.params.id]);
      } else {
        await connection.query("UPDATE FoundReport SET date_time = ?, found_condition = ? WHERE case_id = ?", [dateTime, condition || 'Good', req.params.id]);
      }

      // 6. Update Photos
      if (Array.isArray(photos)) {
        await connection.query("DELETE FROM CasePhoto WHERE case_id = ?", [req.params.id]);
        for (let i = 0; i < photos.length; i++) {
          await connection.query(
            "INSERT INTO CasePhoto (case_id, photo_url, is_primary) VALUES (?, ?, ?)",
            [req.params.id, photos[i], i === 0]
          );
        }
      }

      await connection.commit();

      // --- TRIGGER MATCHING ENGINE ON UPDATE ---
      try {
        const [[caseData]]: any = await pool.query(`
          SELECT c.case_type, c.location_id, c.pet_id, l.city, p.species, p.breed, p.gender, p.color 
          FROM CaseTable c 
          JOIN Location l ON c.location_id = l.location_id
          JOIN PetProfile p ON c.pet_id = p.pet_id
          WHERE c.case_id = ?`, [req.params.id]);

        if (caseData) {
          const otherType = String(caseData.case_type).toUpperCase() === 'LOST' ? 'FOUND' : 'LOST';
          const [potentialMatches]: any = await pool.query(
            `SELECT c.case_id, r.user_id 
             FROM CaseTable c 
             JOIN PetProfile p ON c.pet_id = p.pet_id 
             JOIN Reporter r ON c.reporter_id = r.reporter_id
             JOIN Location l ON c.location_id = l.location_id
             WHERE c.case_type = ? 
             AND p.species = ? 
             AND c.status = 'REPORTED'
             AND LOWER(l.city) = LOWER(?)
             AND (p.gender = ? OR p.gender = 'UNKNOWN' OR ? = 'UNKNOWN')`,
            [otherType, caseData.species, caseData.city, caseData.gender, caseData.gender]
          );

          for (const match of potentialMatches) {
            const [lostRows]: any = await pool.query("SELECT lost_report_id FROM LostReport WHERE case_id = ?", [otherType === 'LOST' ? match.case_id : req.params.id]);
            const [foundRows]: any = await pool.query("SELECT found_report_id FROM FoundReport WHERE case_id = ?", [otherType === 'FOUND' ? match.case_id : req.params.id]);

            if (lostRows.length > 0 && foundRows.length > 0) {
              const lost_report_id = lostRows[0].lost_report_id;
              const found_report_id = foundRows[0].found_report_id;
              const [existing]: any = await pool.query("SELECT * FROM Matches WHERE lost_report_id = ? AND found_report_id = ?", [lost_report_id, found_report_id]);
              if (existing.length === 0) {
                await pool.query("INSERT INTO Matches (lost_report_id, found_report_id, match_score) VALUES (?, ?, ?)", [lost_report_id, found_report_id, 0.82]);
                await pool.query("INSERT INTO Notification (user_id, message) VALUES (?, ?)", [match.user_id, `New Match: A potential match was found after a report was updated!`]);
              }
            }
          }
        }
      } catch (matchErr) {
        console.error("Matching engine (update) error:", matchErr);
      }

      res.json({ message: "Case updated successfully" });
    } catch (err: any) {
      if (connection) await connection.rollback();
      console.error("Update Case Error:", err);
      res.status(500).json({ 
        error: "Update failed", 
        details: err.message,
        stack: err.stack,
        receivedBody: req.body 
      });
    } finally {
      if (connection) connection.release();
    }
  });

  // Delete case
  app.delete("/api/cases/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      // Verify ownership
      const [reporter]: any = await pool.query("SELECT reporter_id FROM Reporter WHERE user_id = ?", [decoded.userId]);
      if (reporter.length === 0) return res.status(403).json({ error: "Reporter profile not found" });

      // First delete related records
      await pool.query("DELETE FROM CasePhoto WHERE case_id = ?", [req.params.id]);
      await pool.query("DELETE FROM Matches WHERE lost_report_id = ? OR found_report_id = ?", [req.params.id, req.params.id]);
      
      const [deleteResult]: any = await pool.query(
        "DELETE FROM CaseTable WHERE case_id = ? AND reporter_id = ?",
        [req.params.id, reporter[0].reporter_id]
      );

      if (deleteResult.affectedRows === 0) return res.status(404).json({ error: "Case not found or unauthorized" });
      res.json({ message: "Case deleted successfully" });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Check if user exists
      const [existingUsers]: any = await pool.query("SELECT * FROM User WHERE email = ?", [email]);
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert user
      const [result]: any = await pool.query(
        "INSERT INTO User (name, email, password_hash, phone) VALUES (?, ?, ?, ?)",
        [name, email, passwordHash, phone || null]
      );

      const userId = result.insertId;

      // Create JWT
      const token = jwt.sign({ userId, email, role: 'USER' }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: userId, name, email, role: 'USER' }
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Failed to register user", details: err.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      // Find user
      const [users]: any = await pool.query("SELECT * FROM User WHERE email = ?", [email]);
      if (users.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = users[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Create JWT
      const token = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed", details: err.message });
    }
  });

  app.get("/api/pets", async (req, res) => {
    if (!pool) {
      return res.status(500).json({ error: "Database not connected" });
    }
    try {
      const [rows] = await pool.query("SELECT * FROM PetProfile ORDER BY created_at DESC LIMIT 20");
      res.json(rows);
    } catch (err: any) {
      if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ECONNREFUSED') {
         return res.json([]);
      }
      res.status(500).json({ error: "Failed to fetch pets", details: err.message });
    }
  });

  // Get user notifications
  app.get("/api/notifications", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const [rows]: any = await pool.query(
        "SELECT notification_id, message, is_read, created_at FROM Notification WHERE user_id = ? ORDER BY created_at DESC", 
        [decoded.userId]
      );
      // Ensure date is sent as UTC ISO string with Z for frontend parsing
      const formatted = rows.map((r: any) => ({
        ...r,
        created_at: new Date(r.created_at).toISOString()
      }));
      res.json(formatted);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get all matches for the user
  app.get("/api/matches", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      // We need to find matches where the user is either the LOST reporter or the FOUND reporter
      const query = `
        SELECT 
          m.match_id, m.match_score, m.match_status, m.created_at as matched_at,
          l_rep.user_id as lost_user_id, f_rep.user_id as found_user_id,
          -- Lost Side
          l_case.case_id as lost_id, l_pet.species as lost_species, l_pet.breed as lost_breed, 
          l_pet.gender as lost_gender, l_pet.age as lost_age, l_pet.color as lost_color,
          l_pet.distinguishing_marks as lost_marks,
          l_loc.city as lost_city, l_case.report_date as lost_date,
          l_case.status as lost_status,
          (SELECT photo_url FROM CasePhoto WHERE case_id = l_case.case_id LIMIT 1) as lost_img,
          l_user.name as lost_user_name, l_user.email as lost_user_email, l_user.phone as lost_user_phone,
          -- Found Side
          f_case.case_id as found_id, f_pet.species as found_species, f_pet.breed as found_breed,
          f_pet.gender as found_gender, f_pet.age as found_age, f_pet.color as found_color,
          f_pet.distinguishing_marks as found_marks,
          f_loc.city as found_city, f_case.report_date as found_date,
          f_case.status as found_status,
          (SELECT photo_url FROM CasePhoto WHERE case_id = f_case.case_id LIMIT 1) as found_img,
          f_user.name as found_user_name, f_user.email as found_user_email, f_user.phone as found_user_phone
        FROM Matches m
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        JOIN CaseTable l_case ON lr.case_id = l_case.case_id
        JOIN PetProfile l_pet ON l_case.pet_id = l_pet.pet_id
        JOIN Location l_loc ON l_case.location_id = l_loc.location_id
        JOIN Reporter l_rep ON l_case.reporter_id = l_rep.reporter_id
        JOIN User l_user ON l_rep.user_id = l_user.user_id
        
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        JOIN CaseTable f_case ON fr.case_id = f_case.case_id
        JOIN PetProfile f_pet ON f_case.pet_id = f_pet.pet_id
        JOIN Location f_loc ON f_case.location_id = f_loc.location_id
        JOIN Reporter f_rep ON f_case.reporter_id = f_rep.reporter_id
        JOIN User f_user ON f_rep.user_id = f_user.user_id
        
        WHERE l_rep.user_id = ? OR f_rep.user_id = ?
        ORDER BY m.match_score DESC
      `;
      const [rows]: any = await pool.query(query, [decoded.userId, decoded.userId]);
      res.json(rows);
    } catch (err: any) {
      console.error("Fetch Matches Error:", err);
      res.status(500).json({ error: "Failed to fetch matches", details: err.message });
    }
  });

  // Get single match details
  app.get("/api/matches/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const query = `
        SELECT 
          m.match_id, m.match_score, m.match_status, m.created_at as matched_at,
          l_rep.user_id as lost_user_id, f_rep.user_id as found_user_id,
          -- Lost Side
          l_case.case_id as lost_id, l_pet.species as lost_species, l_pet.breed as lost_breed, 
          l_pet.gender as lost_gender, l_pet.age as lost_age, l_pet.color as lost_color,
          l_pet.distinguishing_marks as lost_marks,
          l_loc.city as lost_city, l_loc.area as lost_area, l_case.report_date as lost_date,
          l_case.status as lost_status,
          (SELECT photo_url FROM CasePhoto WHERE case_id = l_case.case_id LIMIT 1) as lost_img,
          -- Found Side
          f_case.case_id as found_id, f_pet.species as found_species, f_pet.breed as found_breed,
          f_pet.gender as found_gender, f_pet.age as found_age, f_pet.color as found_color,
          f_pet.distinguishing_marks as found_marks,
          f_loc.city as found_city, f_loc.area as found_area, f_case.report_date as found_date,
          f_case.status as found_status,
          (SELECT photo_url FROM CasePhoto WHERE case_id = f_case.case_id LIMIT 1) as found_img
        FROM Matches m
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        JOIN CaseTable l_case ON lr.case_id = l_case.case_id
        JOIN PetProfile l_pet ON l_case.pet_id = l_pet.pet_id
        JOIN Location l_loc ON l_case.location_id = l_loc.location_id
        JOIN Reporter l_rep ON l_case.reporter_id = l_rep.reporter_id
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        JOIN CaseTable f_case ON fr.case_id = f_case.case_id
        JOIN PetProfile f_pet ON f_case.pet_id = f_pet.pet_id
        JOIN Location f_loc ON f_case.location_id = f_loc.location_id
        JOIN Reporter f_rep ON f_case.reporter_id = f_rep.reporter_id
        WHERE m.match_id = ? AND (l_rep.user_id = ? OR f_rep.user_id = ?)
      `;
      const [rows]: any = await pool.query(query, [req.params.id, decoded.userId, decoded.userId]);
      if (rows.length === 0) return res.status(404).json({ error: "Match not found or unauthorized" });
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch match details" });
    }
  });

  // Update match status (Review Match)
  app.put("/api/matches/:id/status", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const { status } = req.body; // 'CONFIRMED' or 'REJECTED'
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // Verify ownership
      const [matchRows]: any = await pool.query(`
        SELECT m.*, l_rep.user_id as lost_user_id, f_rep.user_id as found_user_id,
               l_case.case_id as lost_case_id, f_case.case_id as found_case_id
        FROM Matches m
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        JOIN CaseTable l_case ON lr.case_id = l_case.case_id
        JOIN Reporter l_rep ON l_case.reporter_id = l_rep.reporter_id
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        JOIN CaseTable f_case ON fr.case_id = f_case.case_id
        JOIN Reporter f_rep ON f_case.reporter_id = f_rep.reporter_id
        WHERE m.match_id = ? AND (l_rep.user_id = ? OR f_rep.user_id = ?)
      `, [req.params.id, decoded.userId, decoded.userId]);

      if (matchRows.length === 0) return res.status(403).json({ error: "Unauthorized to review this match" });

      const match = matchRows[0];
      await pool.query("UPDATE Matches SET match_status = ? WHERE match_id = ?", [status, req.params.id]);
      
      if (status === 'CONFIRMED') {
        // Update both cases to MATCH_FOUND
        await pool.query(
          "UPDATE CaseTable SET status = 'MATCH_FOUND' WHERE case_id IN (?, ?)", 
          [match.lost_case_id, match.found_case_id]
        );
      }
      
      res.json({ message: "Match status updated successfully" });
    } catch (err: any) {
      console.error("Update Match Status Error:", err);
      res.status(500).json({ error: "Failed to update match status" });
    }
  });

  // Mark match as fully recovered
  app.put("/api/matches/:id/recover", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // Verify match and user participation
      const [matchRows]: any = await pool.query(`
        SELECT m.match_status, l_case.case_id as lost_case_id, f_case.case_id as found_case_id,
               l_rep.user_id as lost_user_id
        FROM Matches m
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        JOIN CaseTable l_case ON lr.case_id = l_case.case_id
        JOIN Reporter l_rep ON l_case.reporter_id = l_rep.reporter_id
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        JOIN CaseTable f_case ON fr.case_id = f_case.case_id
        WHERE m.match_id = ? AND m.match_status = 'CONFIRMED'
      `, [req.params.id]);

      if (matchRows.length === 0) return res.status(404).json({ error: "Confirmed match not found" });
      
      const match = matchRows[0];
      // Only the lost pet owner (actual owner) can trigger final recovery
      if (match.lost_user_id !== decoded.userId) {
          console.warn(`Recovery denied: User ${decoded.userId} is not the owner ${match.lost_user_id}`);
          return res.status(403).json({ error: "Only the pet owner can mark recovery" });
      }

      console.log(`Marking match ${req.params.id} (Cases ${match.lost_case_id}, ${match.found_case_id}) as recovered.`);

      // Update both cases to RECOVERED
      await pool.query(
        "UPDATE CaseTable SET status = 'RECOVERED' WHERE case_id IN (?, ?)", 
        [match.lost_case_id, match.found_case_id]
      );

      // Increment historical recovery counter
      await pool.query("UPDATE GlobalStats SET stat_value = stat_value + 1 WHERE stat_key = 'recovered_pets'");
      
      res.json({ message: "Both reports marked as recovered successfully" });
    } catch (err: any) {
      console.error("Recovery Error:", err);
      res.status(500).json({ error: "Failed to mark as recovered", details: err.message });
    }
  });

  // Get overall stats
  app.get("/api/stats", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    try {
      const [totalCases]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable");
      const [recoveredDb]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE status = 'RECOVERED' AND case_type = 'LOST'");
      const [recoveredStat]: any = await pool.query("SELECT stat_value FROM GlobalStats WHERE stat_key = 'recovered_pets'");
      const [active]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE status = 'REPORTED' OR status = 'UNDER_REVIEW'");
      const [matches]: any = await pool.query("SELECT COUNT(*) as count FROM Matches WHERE match_status = 'CONFIRMED'");
      const [totalLost]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE case_type = 'LOST'");
      const totalRecovered = Math.max(recoveredStat[0]?.stat_value || 0, recoveredDb[0].count);
      const baseCount = Math.max(totalRecovered, totalLost[0].count);

      res.json({
        total: totalCases[0].count,
        recovered: totalRecovered,
        active: active[0].count,
        matches: matches[0].count,
        recoveryRate: baseCount > 0 ? Math.round((totalRecovered / baseCount) * 100) : 0
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the dist folder
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const distPath = path.join(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler (Ensures we always return JSON)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      path: req.path
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

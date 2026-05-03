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
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // API Routes
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", message: "PawConnect Backend is running" });
  });

  app.get("/api/test-route", (req, res) => {
    res.json({ message: "Test route works!" });
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
      city, area, date, time, description, reward, condition, photos,
      petId
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
      const [locResult]: any = await connection.query(
        "INSERT INTO Location (city, area, latitude, longitude) VALUES (?, ?, ?, ?)", 
        [city || "Unknown", area || "Unknown", req.body.lat || null, req.body.lng || null]
      );
      const locationId = locResult.insertId;

      // 3. Get or Create PetProfile
      let finalPetId = petId;
      if (!finalPetId) {
        const [petResult]: any = await connection.query(
          "INSERT INTO PetProfile (name, species, breed, age, gender, color, distinguishing_marks, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [petName || null, species || "Unknown", breed || "Unknown", age || null, (gender || 'UNKNOWN').toUpperCase(), color || "Unknown", marks || null, null]
        );
        finalPetId = petResult.insertId;
      }

      // 4. Create CaseTable
      const [caseResult]: any = await connection.query(
        "INSERT INTO CaseTable (reporter_id, location_id, pet_id, case_type, description) VALUES (?, ?, ?, ?, ?)",
        [reporterId, locationId, finalPetId, (type || 'LOST').toUpperCase(), description || null]
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
        
        const [potentialMatches]: any = await pool.query(
          `SELECT 
             c.case_id, r.user_id, p.breed, p.gender, p.color,
             l.city, l.area, l.latitude, l.longitude
           FROM CaseTable c 
           JOIN PetProfile p ON c.pet_id = p.pet_id 
           JOIN Reporter r ON c.reporter_id = r.reporter_id
           JOIN Location l ON c.location_id = l.location_id
           WHERE c.case_type = ? 
           AND p.species = ? 
           AND c.status = 'REPORTED'
           AND (LOWER(l.city) = LOWER(?) OR ? IS NULL)
           AND (p.gender = ? OR p.gender = 'UNKNOWN' OR ? = 'UNKNOWN')
           AND (p.breed IS NULL OR ? IS NULL OR p.breed LIKE ? OR ? LIKE CONCAT('%', p.breed, '%'))
           AND (p.color IS NULL OR ? IS NULL OR p.color LIKE ? OR ? LIKE CONCAT('%', p.color, '%'))`,
          [
            otherType, species, 
            city, city,
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
                    // Calculate match score
                    let matchScore = 0.65; // Base score for species/breed/color/gender match
                    
                    // Location-based bonus/penalty
                    const currentLat = req.body.lat;
                    const currentLng = req.body.lng;
                    const matchLat = match.latitude;
                    const matchLng = match.longitude;

                    if (currentLat && currentLng && matchLat && matchLng) {
                      // Haversine distance
                      const R = 6371; // km
                      const dLat = (Number(matchLat) - Number(currentLat)) * Math.PI / 180;
                      const dLon = (Number(matchLng) - Number(currentLng)) * Math.PI / 180;
                      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                Math.cos(Number(currentLat) * Math.PI / 180) * Math.cos(Number(matchLat) * Math.PI / 180) * 
                                Math.sin(dLon/2) * Math.sin(dLon/2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                      const distance = R * c;

                      if (distance < 2) matchScore += 0.30; // Very close
                      else if (distance < 5) matchScore += 0.20; // Close
                      else if (distance < 10) matchScore += 0.10; // Moderate
                      else matchScore -= 0.15; // Far
                    } else {
                      // Fallback to text-based location match if no GPS
                      if (city && match.city && city.toLowerCase() === match.city.toLowerCase()) {
                        matchScore += 0.15;
                        if (area && match.area && (area.toLowerCase().includes(match.area.toLowerCase()) || match.area.toLowerCase().includes(area.toLowerCase()))) {
                          matchScore += 0.10; // Area bonus
                        }
                      }
                    }

                   // Cap score
                   matchScore = Math.min(0.98, Math.max(0.1, matchScore));

                   await pool.query(
                     "INSERT INTO Matches (lost_report_id, found_report_id, match_score) VALUES (?, ?, ?)",
                     [lost_report_id, found_report_id, matchScore]
                   );

                   // If high confidence match, move both cases to UNDER_REVIEW
                   if (matchScore >= 0.80) {
                     await pool.query(
                       "UPDATE CaseTable SET status = 'UNDER_REVIEW' WHERE case_id IN (?, ?)",
                       [caseId, match.case_id]
                     );
                     console.log(`Auto-review: Cases ${caseId} and ${match.case_id} moved to UNDER_REVIEW due to ${Math.round(matchScore*100)}% match.`);
                   }

                  // 2. Create notification for the existing case owner only for NEW matches
                  await pool.query(
                    "INSERT INTO Notification (user_id, message, created_at) VALUES (?, ?, UTC_TIMESTAMP())",
                    [match.user_id, `Match Alert: A high-confidence match was found for your ${species}! Your case is now Under Review while we verify the details.`]
                  );
               }
             }
          }
          // 3. Create notification for the new reporter if any matches were found
          if (potentialMatches.length > 0) {
            await pool.query(
              "INSERT INTO Notification (user_id, message, created_at) VALUES (?, ?, UTC_TIMESTAMP())",
              [decoded.userId, `Success! We found ${potentialMatches.length} matches. Your case is Under Review while our team verifies the best hit.`]
            );
          }
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

  // Get all cases (for Dashboard and All Cases page)
  app.get("/api/cases", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    
    const { species, type, city, limit, offset } = req.query;
    let query = `
      SELECT c.*, p.species, p.breed, p.color, p.gender, p.age, l.city, l.area, ph.photo_url 
      FROM CaseTable c
      JOIN PetProfile p ON c.pet_id = p.pet_id
      JOIN Location l ON c.location_id = l.location_id
      LEFT JOIN CasePhoto ph ON c.case_id = ph.case_id AND ph.is_primary = 1
      WHERE 1=1
    `;
    const params: any[] = [];

    if (species) { query += " AND p.species = ?"; params.push(species); }
    if (type) { query += " AND c.case_type = ?"; params.push(type.toString().toUpperCase()); }
    if (city) { query += " AND l.city = ?"; params.push(city); }

    query += " ORDER BY c.report_date DESC";

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit.toString()));
      if (offset) {
        query += " OFFSET ?";
        params.push(parseInt(offset.toString()));
      }
    }

    try {
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch cases", details: err.message });
    }
  });

  // Get user-specific cases (with pagination and filtering)
  app.get("/api/my-cases", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { limit, offset, type, search } = req.query;

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const [users]: any = await pool.query("SELECT role FROM User WHERE user_id = ?", [decoded.userId]);
      const userRole = users[0]?.role || decoded.role;
      const isAdmin = userRole?.toUpperCase() === 'ADMIN';
      
      console.log(`[DEBUG] my-cases: type=${type}, role=${userRole}, isAdmin=${isAdmin}`);
      
      let query = `
        SELECT c.*, p.species, p.breed, p.color, p.gender, p.age, l.city, l.area, ph.photo_url, lr.reward
        FROM CaseTable c
        LEFT JOIN Reporter r ON c.reporter_id = r.reporter_id
        LEFT JOIN PetProfile p ON c.pet_id = p.pet_id
        LEFT JOIN Location l ON c.location_id = l.location_id
        LEFT JOIN CasePhoto ph ON c.case_id = ph.case_id AND ph.is_primary = 1
        LEFT JOIN LostReport lr ON c.case_id = lr.case_id
        WHERE 1=1
      `;
      
      let queryParams: any[] = [];
      if (!isAdmin) {
        query += " AND r.user_id = ?";
        queryParams.push(decoded.userId);
      }

      if (type && type !== 'ALL') {
        query += " AND c.case_type = ?";
        queryParams.push(type.toString().toUpperCase());
      }

      if (search) {
        query += " AND (p.breed LIKE ? OR l.city LIKE ? OR l.area LIKE ?)";
        const s = `%${search}%`;
        queryParams.push(s, s, s);
      }
      
      query += " ORDER BY c.report_date DESC";
      
      if (limit) {
        query += " LIMIT ?";
        queryParams.push(parseInt(limit.toString()));
        if (offset) {
          query += " OFFSET ?";
          queryParams.push(parseInt(offset.toString()));
        }
      }
      
      const [rows] = await pool.query(query, queryParams);
      console.log(`[DEBUG] my-cases query: ${query.replace(/\s+/g, ' ').trim()}`);
      console.log(`[DEBUG] my-cases params: ${JSON.stringify(queryParams)}`);
      res.json(rows);
    } catch (err) {
      console.error("My Cases Error:", err);
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get user-specific case counts
  app.get("/api/my-cases/stats", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const [users]: any = await pool.query("SELECT role FROM User WHERE user_id = ?", [decoded.userId]);
      const isAdmin = (users[0]?.role || decoded.role)?.toUpperCase() === 'ADMIN';

      let baseQuery = `
        SELECT c.case_type, COUNT(*) as count 
        FROM CaseTable c
        LEFT JOIN Reporter r ON c.reporter_id = r.reporter_id
      `;
      
      let params: any[] = [];
      if (!isAdmin) {
        baseQuery += " WHERE r.user_id = ?";
        params.push(decoded.userId);
      }
      
      baseQuery += " GROUP BY c.case_type";
      
      const [rows]: any = await pool.query(baseQuery, params);
      console.log(`[DEBUG] my-cases/stats: rows=${JSON.stringify(rows)}`);
      
      const stats = {
        all: 0,
        lost: 0,
        found: 0
      };
      
      rows.forEach((row: any) => {
        if (row.case_type === 'LOST') stats.lost = row.count;
        if (row.case_type === 'FOUND') stats.found = row.count;
      });
      stats.all = stats.lost + stats.found;
      
      res.json(stats);
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
      const isAdmin = decoded.role?.toUpperCase() === 'ADMIN';

      let updateQuery = "UPDATE CaseTable SET status = ? WHERE case_id = ?";
      let queryParams = [status, req.params.id];

      if (!isAdmin) {
        // Verify ownership for non-admins
        const [reporter]: any = await pool.query("SELECT reporter_id FROM Reporter WHERE user_id = ?", [decoded.userId]);
        if (reporter.length === 0) return res.status(403).json({ error: "Reporter profile not found" });
        updateQuery = "UPDATE CaseTable SET status = ? WHERE case_id = ? AND reporter_id = ?";
        queryParams = [status, req.params.id, reporter[0].reporter_id];
      }

      const [updateResult]: any = await pool.query(updateQuery, queryParams);

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
    try {
      let decoded: any = null;
      let isAdmin = false;
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        decoded = jwt.verify(token, JWT_SECRET);
        const [users]: any = await pool.query("SELECT role FROM User WHERE user_id = ?", [decoded.userId]);
        isAdmin = (users[0]?.role || decoded.role)?.toUpperCase() === 'ADMIN';
      }

      let query = `
        SELECT 
          c.case_id, c.case_type, c.status, c.report_date, c.description,
          p.name as pet_name, p.species, p.breed, p.age, p.gender, p.color, p.distinguishing_marks,
          l.city, l.area, 
          lr.reward, 
          fr.found_condition,
          u.name as reporter_name, 
          u.email as reporter_email, 
          u.phone as reporter_phone,
          r.user_id as reporter_user_id,
          l.latitude, l.longitude
        FROM CaseTable c
        JOIN PetProfile p ON c.pet_id = p.pet_id
        JOIN Location l ON c.location_id = l.location_id
        JOIN Reporter r ON c.reporter_id = r.reporter_id
        JOIN User u ON r.user_id = u.user_id
        LEFT JOIN LostReport lr ON c.case_id = lr.case_id
        LEFT JOIN FoundReport fr ON c.case_id = fr.case_id
        WHERE c.case_id = ?
      `;
      
      let queryParams = [req.params.id];
      const [rows]: any = await pool.query(query, queryParams);
      if (rows.length === 0) return res.status(404).json({ error: "Case not found" });
      
      // Get all photos
      const [photos]: any = await pool.query("SELECT photo_url FROM CasePhoto WHERE case_id = ?", [req.params.id]);
      
      // Check for confirmed matches involving this case
      const [confirmedMatch]: any = await pool.query(`
        SELECT m.match_id 
        FROM Matches m 
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id 
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id 
        WHERE (lr.case_id = ? OR fr.case_id = ?) AND m.match_status = 'CONFIRMED'
      `, [req.params.id, req.params.id]);

      res.json({ 
        ...rows[0], 
        photos: photos.map((p: any) => p.photo_url),
        has_confirmed_match: confirmedMatch.length > 0 
      });
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
      city, area, date, time, description, reward, condition, photos,
      petId
    } = req.body;

    let connection;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // Get role from DB for security
      const [users]: any = await pool.query("SELECT role FROM User WHERE user_id = ?", [decoded.userId]);
      const isAdmin = (users[0]?.role || decoded.role)?.toUpperCase() === 'ADMIN';

      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Verify existence and ownership (if not admin)
      let verificationQuery = `
        SELECT c.pet_id, c.location_id 
        FROM CaseTable c 
        JOIN Reporter r ON c.reporter_id = r.reporter_id 
        WHERE c.case_id = ?
      `;
      let verificationParams = [req.params.id];
      
      if (!isAdmin) {
        verificationQuery += " AND r.user_id = ?";
        verificationParams.push(decoded.userId);
      }

      const [caseRows]: any = await connection.query(verificationQuery, verificationParams);
      if (caseRows.length === 0) throw new Error("Case not found or unauthorized");

      const { pet_id, location_id } = caseRows[0];

      // 2. Update Location
      await connection.query(
        "UPDATE Location SET city = ?, area = ?, latitude = ?, longitude = ? WHERE location_id = ?", 
        [city, area, req.body.lat || null, req.body.lng || null, location_id]
      );

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
            `SELECT 
              c.case_id, r.user_id, p.species, p.breed, p.color, p.gender,
              l.latitude, l.longitude
            FROM CaseTable c
            JOIN PetProfile p ON c.pet_id = p.pet_id
            JOIN Location l ON c.location_id = l.location_id
            JOIN Reporter r ON c.reporter_id = r.reporter_id
            WHERE c.case_type = ? 
            AND p.species = ? 
            AND c.status = 'REPORTED'
            AND (p.gender = ? OR p.gender = 'UNKNOWN' OR ? = 'UNKNOWN')
            AND (p.breed IS NULL OR ? IS NULL OR p.breed LIKE ? OR ? LIKE CONCAT('%', p.breed, '%'))
            AND (p.color IS NULL OR ? IS NULL OR p.color LIKE ? OR ? LIKE CONCAT('%', p.color, '%'))`,
            [otherType, caseData.species, caseData.gender, caseData.gender, caseData.breed, `%${caseData.breed}%`, caseData.breed, caseData.color, `%${caseData.color}%`, caseData.color]
          );

          for (const match of potentialMatches) {
            const [lostRows]: any = await pool.query("SELECT lost_report_id FROM LostReport WHERE case_id = ?", [otherType === 'LOST' ? match.case_id : req.params.id]);
            const [foundRows]: any = await pool.query("SELECT found_report_id FROM FoundReport WHERE case_id = ?", [otherType === 'FOUND' ? match.case_id : req.params.id]);

            if (lostRows.length > 0 && foundRows.length > 0) {
              const lost_report_id = lostRows[0].lost_report_id;
              const found_report_id = foundRows[0].found_report_id;
              const [existing]: any = await pool.query("SELECT * FROM Matches WHERE lost_report_id = ? AND found_report_id = ?", [lost_report_id, found_report_id]);
              
              if (existing.length === 0) {
                // Calculate match score using robust logic
                let matchScore = 0.65;
                
                // Location check
                const currentLat = req.body.lat;
                const currentLng = req.body.lng;
                if (currentLat && currentLng && match.latitude && match.longitude) {
                  const R = 6371;
                  const dLat = (Number(match.latitude) - Number(currentLat)) * Math.PI / 180;
                  const dLon = (Number(match.longitude) - Number(currentLng)) * Math.PI / 180;
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(Number(currentLat) * Math.PI / 180) * Math.cos(Number(match.latitude) * Math.PI / 180) * 
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  const distance = R * c;

                  if (distance < 2) matchScore += 0.30;
                  else if (distance < 5) matchScore += 0.20;
                  else if (distance < 10) matchScore += 0.10;
                  else matchScore -= 0.15;
                } else {
                  if (city && match.city && city.toLowerCase() === match.city.toLowerCase()) {
                    matchScore += 0.15;
                    if (area && match.area && (area.toLowerCase().includes(match.area.toLowerCase()) || match.area.toLowerCase().includes(area.toLowerCase()))) {
                      matchScore += 0.10;
                    }
                  }
                }

                matchScore = Math.min(0.98, Math.max(0.1, matchScore));
                await pool.query("INSERT INTO Matches (lost_report_id, found_report_id, match_score) VALUES (?, ?, ?)", [lost_report_id, found_report_id, matchScore]);
                
                if (matchScore >= 0.80) {
                  await pool.query("UPDATE CaseTable SET status = 'UNDER_REVIEW' WHERE case_id IN (?, ?)", [req.params.id, match.case_id]);
                }

                await pool.query("INSERT INTO Notification (user_id, message) VALUES (?, ?)", [match.user_id, `Match Update: A new potential hit was found after a report update. Your case is now Under Review.`]);
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
      const isAdmin = decoded.role?.toUpperCase() === 'ADMIN';

      // First delete related records
      await pool.query("DELETE FROM CasePhoto WHERE case_id = ?", [req.params.id]);
      await pool.query("DELETE FROM Matches WHERE lost_report_id = ? OR found_report_id = ?", [req.params.id, req.params.id]);
      
      let deleteQuery = "DELETE FROM CaseTable WHERE case_id = ?";
      let queryParams = [req.params.id];

      if (!isAdmin) {
        // Verify ownership for non-admins
        const [reporter]: any = await pool.query("SELECT reporter_id FROM Reporter WHERE user_id = ?", [decoded.userId]);
        if (reporter.length === 0) return res.status(403).json({ error: "Reporter profile not found" });
        deleteQuery = "DELETE FROM CaseTable WHERE case_id = ? AND reporter_id = ?";
        queryParams = [req.params.id, reporter[0].reporter_id];
      }

      const [deleteResult]: any = await pool.query(deleteQuery, queryParams);

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

  // Get current user profile
  app.get("/api/user/profile", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const [users]: any = await pool.query("SELECT user_id, name, email, phone, role, created_at FROM User WHERE user_id = ?", [decoded.userId]);
      if (users.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(users[0]);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { name, email, phone } = req.body;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      await pool.query(
        "UPDATE User SET name = ?, email = ?, phone = ? WHERE user_id = ?", 
        [name, email, phone, decoded.userId]
      );
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Update user password
  app.put("/api/user/password", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { currentPassword, newPassword } = req.body;

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // 1. Get current user's password hash
      const [users]: any = await pool.query("SELECT password_hash FROM User WHERE user_id = ?", [decoded.userId]);
      if (users.length === 0) return res.status(404).json({ error: "User not found" });

      const user = users[0];

      // 2. Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect current password" });
      }

      // 3. Hash new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // 4. Update database
      await pool.query("UPDATE User SET password_hash = ? WHERE user_id = ?", [newPasswordHash, decoded.userId]);

      res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get current user's pets
  app.get("/api/my-pets", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const [pets]: any = await pool.query(`
        SELECT p.*, ph.photo_url 
        FROM PetProfile p 
        LEFT JOIN PetPhoto ph ON p.pet_id = ph.pet_id AND ph.is_primary = 1 
        WHERE p.owner_id = ?
      `, [decoded.userId]);
      res.json(pets);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get a single pet detail
  app.get("/api/my-pets/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const [pets]: any = await pool.query(`
        SELECT p.*
        FROM PetProfile p 
        WHERE p.pet_id = ? AND p.owner_id = ?
      `, [req.params.id, decoded.userId]);
      
      if (pets.length === 0) return res.status(404).json({ error: "Pet not found" });

      const [photos]: any = await pool.query("SELECT photo_url, is_primary FROM PetPhoto WHERE pet_id = ?", [req.params.id]);
      
      res.json({
        ...pets[0],
        photos: photos.map((p: any) => p.photo_url),
        photo_url: photos.find((p: any) => p.is_primary)?.photo_url || null
      });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Delete a pet
  app.delete("/api/my-pets/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      // Delete will cascade to PetPhoto if foreign key is set correctly
      const [result]: any = await pool.query("DELETE FROM PetProfile WHERE pet_id = ? AND owner_id = ?", [req.params.id, decoded.userId]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Pet not found or unauthorized" });
      res.json({ success: true });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get cases for a specific pet
  app.get("/api/my-pets/:id/cases", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const [cases]: any = await pool.query(`
        SELECT c.*, l.city, l.area 
        FROM CaseTable c 
        JOIN Location l ON c.location_id = l.location_id 
        JOIN PetProfile p ON c.pet_id = p.pet_id 
        WHERE c.pet_id = ? AND p.owner_id = ?
      `, [req.params.id, decoded.userId]);
      res.json(cases);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Update a pet
  app.put("/api/my-pets/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { name, species, breed, age, gender, color, distinguishing_marks, image } = req.body;
    
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      // Update basic info
      const [result]: any = await pool.query(
        "UPDATE PetProfile SET name = ?, species = ?, breed = ?, age = ?, gender = ?, color = ?, distinguishing_marks = ? WHERE pet_id = ? AND owner_id = ?",
        [name, species, breed, age, gender?.toUpperCase(), color, distinguishing_marks, req.params.id, decoded.userId]
      );
      
      if (result.affectedRows === 0) return res.status(404).json({ error: "Pet not found or unauthorized" });

      // Update images if provided
      if (req.body.images && Array.isArray(req.body.images)) {
        // Delete old photos if we want to replace them, OR just add new ones.
        // Usually for 'Update', users expect to manage the list. 
        // For simplicity, let's replace them if 'images' is sent.
        await pool.query("DELETE FROM PetPhoto WHERE pet_id = ?", [req.params.id]);
        for (let i = 0; i < req.body.images.length; i++) {
          await pool.query("INSERT INTO PetPhoto (pet_id, photo_url, is_primary) VALUES (?, ?, ?)", 
            [req.params.id, req.body.images[i], i === 0 ? 1 : 0]);
        }
      } else if (image) {
        await pool.query("UPDATE PetPhoto SET is_primary = 0 WHERE pet_id = ?", [req.params.id]);
        await pool.query("INSERT INTO PetPhoto (pet_id, photo_url, is_primary) VALUES (?, ?, 1)", [req.params.id, image]);
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update pet:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add a new pet
  app.post("/api/my-pets", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { name, species, breed, age, gender, color, distinguishing_marks, image } = req.body;
    
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const [result]: any = await pool.query(
        "INSERT INTO PetProfile (name, species, breed, age, gender, color, distinguishing_marks, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, species, breed, age, gender.toUpperCase(), color, distinguishing_marks, decoded.userId]
      );
      
      const petId = result.insertId;

      if (req.body.images && Array.isArray(req.body.images)) {
        for (let i = 0; i < req.body.images.length; i++) {
          await pool.query("INSERT INTO PetPhoto (pet_id, photo_url, is_primary) VALUES (?, ?, ?)", 
            [petId, req.body.images[i], i === 0 ? 1 : 0]);
        }
      } else if (image) {
        await pool.query("INSERT INTO PetPhoto (pet_id, photo_url, is_primary) VALUES (?, ?, 1)", [petId, image]);
      }

      res.status(201).json({ success: true, petId });
    } catch (err) {
      console.error("Failed to add pet:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user-specific stats
  app.get("/api/user/stats", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const [totalReports]: any = await pool.query(`
        SELECT COUNT(*) as count FROM CaseTable c
        JOIN Reporter r ON c.reporter_id = r.reporter_id
        WHERE r.user_id = ?
      `, [decoded.userId]);

      const [recovered]: any = await pool.query(`
        SELECT COUNT(*) as count FROM CaseTable c
        JOIN Reporter r ON c.reporter_id = r.reporter_id
        WHERE r.user_id = ? AND c.status = 'RECOVERED'
      `, [decoded.userId]);

      const [matchesCount]: any = await pool.query(`
        SELECT COUNT(DISTINCT m.match_id) as count
        FROM Matches m
        LEFT JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        LEFT JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        LEFT JOIN CaseTable lc ON lr.case_id = lc.case_id
        LEFT JOIN CaseTable fc ON fr.case_id = fc.case_id
        LEFT JOIN Reporter lr_p ON lc.reporter_id = lr_p.reporter_id
        LEFT JOIN Reporter fr_p ON fc.reporter_id = fr_p.reporter_id
        WHERE lr_p.user_id = ? OR fr_p.user_id = ?
      `, [decoded.userId, decoded.userId]);

      const [user]: any = await pool.query("SELECT created_at FROM User WHERE user_id = ?", [decoded.userId]);

      res.json({
        totalReports: totalReports[0].count,
        recovered: recovered[0].count,
        matchesFound: matchesCount[0].count,
        memberSince: user[0]?.created_at || new Date()
      });
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
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

  // Get all matches (all for admin, personal for user)
  app.get("/api/matches", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const isAdmin = decoded.role?.toUpperCase() === "ADMIN";

      // Base query for matches with all necessary joins
      let query = `
        SELECT 
          m.match_id, m.match_score, m.match_status, m.created_at as matched_at,
          l_rep.user_id as lost_user_id, f_rep.user_id as found_user_id,
          -- Lost Side
          l_case.case_id as lost_id, l_pet.species as lost_species, l_pet.breed as lost_breed, 
          l_pet.gender as lost_gender, l_pet.age as lost_age, l_pet.color as lost_color,
          l_pet.distinguishing_marks as lost_marks,
          l_loc.city as lost_city, l_loc.latitude as lost_lat, l_loc.longitude as lost_lng,
          l_case.report_date as lost_date,
          l_case.status as lost_status,
          (SELECT photo_url FROM CasePhoto WHERE case_id = l_case.case_id LIMIT 1) as lost_img,
          l_user.name as lost_user_name, l_user.email as lost_user_email, l_user.phone as lost_user_phone,
          -- Found Side
          f_case.case_id as found_id, f_pet.species as found_species, f_pet.breed as found_breed,
          f_pet.gender as found_gender, f_pet.age as found_age, f_pet.color as found_color,
          f_pet.distinguishing_marks as found_marks,
          f_loc.city as found_city, f_loc.latitude as found_lat, f_loc.longitude as found_lng,
          f_case.report_date as found_date,
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
      `;

      let params: any[] = [];
      if (!isAdmin) {
        query += ` WHERE l_rep.user_id = ? OR f_rep.user_id = ? `;
        params = [decoded.userId, decoded.userId];
      }

      query += ` ORDER BY m.match_score DESC `;

      const [rows]: any = await pool.query(query, params);
      res.json(rows);
    } catch (err: any) {
      console.error("Fetch Matches Error:", err);
      res.status(500).json({ error: "Failed to fetch matches", details: err.message });
    }
  });

  // Get matches for a specific case
  app.get("/api/cases/:id/matches", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const caseId = req.params.id;
      
      const query = `
        SELECT 
          m.match_id, m.match_score, m.match_status, m.created_at as matched_at,
          -- Other Side Case Info
          CASE WHEN lr.case_id = ? THEN f_case.case_id ELSE l_case.case_id END as other_case_id,
          CASE WHEN lr.case_id = ? THEN f_pet.species ELSE l_pet.species END as other_species,
          CASE WHEN lr.case_id = ? THEN f_pet.breed ELSE l_pet.breed END as other_breed,
          CASE WHEN lr.case_id = ? THEN (SELECT photo_url FROM CasePhoto WHERE case_id = f_case.case_id LIMIT 1) 
               ELSE (SELECT photo_url FROM CasePhoto WHERE case_id = l_case.case_id LIMIT 1) END as other_img,
          CASE WHEN lr.case_id = ? THEN 'FOUND' ELSE 'LOST' END as other_type
        FROM Matches m
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        JOIN CaseTable l_case ON lr.case_id = l_case.case_id
        JOIN CaseTable f_case ON fr.case_id = f_case.case_id
        JOIN PetProfile l_pet ON l_case.pet_id = l_pet.pet_id
        JOIN PetProfile f_pet ON f_case.pet_id = f_pet.pet_id
        WHERE (l_case.case_id = ? OR f_case.case_id = ?)
        ORDER BY m.match_score DESC
      `;
      const [rows]: any = await pool.query(query, [caseId, caseId, caseId, caseId, caseId, caseId, caseId]);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch case matches" });
    }
  });

  // Get Top Global Matches (for Dashboard)
  app.get("/api/top-matches", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    try {
      const query = `
        SELECT 
          m.match_id, m.match_score, m.match_status, m.created_at as matched_at,
          -- Lost Side
          l_pet.breed as lost_breed, l_loc.area as lost_area,
          (SELECT photo_url FROM CasePhoto WHERE case_id = l_case.case_id LIMIT 1) as lost_img,
          -- Found Side
          f_pet.breed as found_breed, f_loc.area as found_area,
          (SELECT photo_url FROM CasePhoto WHERE case_id = f_case.case_id LIMIT 1) as found_img
        FROM Matches m
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        JOIN CaseTable l_case ON lr.case_id = l_case.case_id
        JOIN PetProfile l_pet ON l_case.pet_id = l_pet.pet_id
        JOIN Location l_loc ON l_case.location_id = l_loc.location_id
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        JOIN CaseTable f_case ON fr.case_id = f_case.case_id
        JOIN PetProfile f_pet ON f_case.pet_id = f_pet.pet_id
        JOIN Location f_loc ON f_case.location_id = f_loc.location_id
        WHERE m.match_status != 'REJECTED'
        ORDER BY m.match_score DESC
        LIMIT 3
      `;
      const [rows] = await pool.query(query);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch top matches" });
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
      const isAdmin = decoded.role?.toUpperCase() === "ADMIN";

      let query = `
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
        WHERE m.match_id = ?
      `;

      let params = [req.params.id];
      if (!isAdmin) {
        query += ` AND (l_rep.user_id = ? OR f_rep.user_id = ?) `;
        params.push(decoded.userId, decoded.userId);
      }

      const [rows]: any = await pool.query(query, params);
      if (rows.length === 0) return res.status(404).json({ error: "Match not found or unauthorized" });
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch match details" });
    }
  });

  // Update match status (Review Match)
  // Update match status (Review Match)
  app.put("/api/matches/:id/status", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const { status } = req.body; // 'CONFIRMED' or 'REJECTED'
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const isAdmin = decoded.role?.toUpperCase() === "ADMIN";
      
      // Verify ownership or admin
      let authQuery = `
        SELECT m.*, l_rep.user_id as lost_user_id, f_rep.user_id as found_user_id,
               l_case.case_id as lost_case_id, f_case.case_id as found_case_id
        FROM Matches m
        JOIN LostReport lr ON m.lost_report_id = lr.lost_report_id
        JOIN CaseTable l_case ON lr.case_id = l_case.case_id
        JOIN Reporter l_rep ON l_case.reporter_id = l_rep.reporter_id
        JOIN FoundReport fr ON m.found_report_id = fr.found_report_id
        JOIN CaseTable f_case ON fr.case_id = f_case.case_id
        JOIN Reporter f_rep ON f_case.reporter_id = f_rep.reporter_id
        WHERE m.match_id = ?
      `;

      let authParams = [req.params.id];
      if (!isAdmin) {
        authQuery += ` AND (l_rep.user_id = ? OR f_rep.user_id = ?) `;
        authParams.push(decoded.userId, decoded.userId);
      }

      const [matchRows]: any = await pool.query(authQuery, authParams);

      if (matchRows.length === 0) return res.status(403).json({ error: "Unauthorized to review this match" });

      const match = matchRows[0];
      await pool.query("UPDATE Matches SET match_status = ? WHERE match_id = ?", [status, req.params.id]);
      
      if (status === 'CONFIRMED') {
        // Update both cases to MATCH_FOUND
        await pool.query(
          "UPDATE CaseTable SET status = 'MATCH_FOUND' WHERE case_id IN (?, ?)", 
          [match.lost_case_id, match.found_case_id]
        );
      } else if (status === 'REJECTED') {
        // Move cases back to REPORTED if they were UNDER_REVIEW
        await pool.query(
          "UPDATE CaseTable SET status = 'REPORTED' WHERE case_id IN (?, ?) AND status = 'UNDER_REVIEW'",
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

  // Delete match (Admin only)
  app.delete("/api/matches/:id", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.role?.toUpperCase() !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      await pool.query("DELETE FROM Matches WHERE match_id = ?", [req.params.id]);
      res.json({ message: "Match deleted successfully" });
    } catch (err: any) {
      console.error("Delete Match Error:", err);
      res.status(500).json({ error: "Failed to delete match" });
    }
  });

  // Public Cases Stats
  app.get("/api/public/cases/stats", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    try {
      const [all]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE status IN ('REPORTED', 'UNDER_REVIEW')");
      const [lost]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE case_type = 'LOST' AND status IN ('REPORTED', 'UNDER_REVIEW')");
      const [found]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE case_type = 'FOUND' AND status IN ('REPORTED', 'UNDER_REVIEW')");
      res.json({ all: all[0].count, lost: lost[0].count, found: found[0].count });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch public stats" });
    }
  });

  // Public Cases List
  app.get("/api/public/cases", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    const { limit = 10, offset = 0, type = 'ALL', search = '' } = req.query;
    
    try {
      let query = `
        SELECT 
          c.*, p.name as pet_name, p.species, p.breed, p.color, p.gender, p.age,
          l.city, l.area, l.latitude, l.longitude,
          (SELECT photo_url FROM CasePhoto WHERE case_id = c.case_id LIMIT 1) as photo_url,
          lr.reward,
          fr.found_condition
        FROM CaseTable c
        JOIN PetProfile p ON c.pet_id = p.pet_id
        JOIN Location l ON c.location_id = l.location_id
        LEFT JOIN LostReport lr ON c.case_id = lr.case_id
        LEFT JOIN FoundReport fr ON c.case_id = fr.case_id
        WHERE c.status IN ('REPORTED', 'UNDER_REVIEW')
      `;
      const params: any[] = [];

      if (type !== 'ALL') {
        query += " AND c.case_type = ? ";
        params.push(type);
      }

      if (search) {
        query += " AND (p.breed LIKE ? OR l.city LIKE ? OR l.area LIKE ?) ";
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += " ORDER BY c.report_date DESC LIMIT ? OFFSET ? ";
      params.push(Number(limit), Number(offset));

      const [rows]: any = await pool.query(query, params);
      res.json(rows);
    } catch (err: any) {
      console.error("Public Cases Error:", err);
      res.status(500).json({ error: "Failed to fetch public cases" });
    }
  });

  // Get overall stats (for Dashboard)
  app.get("/api/stats", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    try {
      const [totalCases]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable");
      const [recoveredDb]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE status = 'RECOVERED' AND case_type = 'LOST'");
      const [recoveredStat]: any = await pool.query("SELECT stat_value FROM GlobalStats WHERE stat_key = 'recovered_pets'");
      const [active]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE status = 'REPORTED' OR status = 'UNDER_REVIEW'");
      const [matches]: any = await pool.query("SELECT COUNT(*) as count FROM Matches WHERE match_status = 'CONFIRMED'");
      const [totalLost]: any = await pool.query("SELECT COUNT(*) as count FROM CaseTable WHERE case_type = 'LOST'");
      
      // Distribution data
      const [speciesDist]: any = await pool.query("SELECT species as name, COUNT(*) as value FROM PetProfile GROUP BY species");
      const [locationDist]: any = await pool.query(`
        SELECT l.city as name, COUNT(*) as count 
        FROM CaseTable c 
        JOIN Location l ON c.location_id = l.location_id 
        GROUP BY l.city 
        ORDER BY count DESC 
        LIMIT 4
      `);

      const totalRecovered = Math.max(recoveredStat[0]?.stat_value || 0, recoveredDb[0].count);
      const baseCount = Math.max(totalRecovered, totalLost[0].count);
      const totalCount = totalCases[0].count;

      res.json({
        total: totalCount,
        recovered: totalRecovered,
        active: active[0].count,
        matches: matches[0].count,
        recoveryRate: baseCount > 0 ? Math.round((totalRecovered / baseCount) * 100) : 0,
        speciesDistribution: speciesDist.map((s: any) => ({
          ...s,
          value: totalCount > 0 ? Math.round((s.value / totalCount) * 100) : 0
        })),
        locationDistribution: locationDist.map((l: any) => ({
          ...l,
          percentage: totalCount > 0 ? Math.round((l.count / totalCount) * 100) : 0
        }))
      });
    } catch (err: any) {
      console.error("Stats Error:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });


  // Detailed Admin Analytics
  app.get("/api/admin/analytics", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Database not connected" });
    
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
      if (decoded.role?.toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      // 1. Overview Stats
      const [stats]: any = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM CaseTable) as totalCases,
          (SELECT COUNT(*) FROM CaseTable WHERE status IN ('REPORTED', 'UNDER_REVIEW')) as activeCases,
          (SELECT COUNT(*) FROM CaseTable WHERE status = 'RECOVERED') as recoveredCases,
          (SELECT COUNT(*) FROM Matches WHERE match_status = 'CONFIRMED') as confirmedMatches
      `);

      // 2. Monthly Trends (Last 6 Months)
      const [trends]: any = await pool.query(`
        SELECT 
          DATE_FORMAT(report_date, '%b') as name,
          SUM(CASE WHEN case_type = 'LOST' THEN 1 ELSE 0 END) as lost,
          SUM(CASE WHEN case_type = 'FOUND' THEN 1 ELSE 0 END) as found,
          SUM(CASE WHEN status = 'RECOVERED' THEN 1 ELSE 0 END) as recovered
        FROM CaseTable
        WHERE report_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(report_date, '%Y-%m'), name
        ORDER BY MIN(report_date)
      `);

      // 3. Species Distribution
      const [species]: any = await pool.query(`
        SELECT species as name, COUNT(*) as value
        FROM PetProfile
        GROUP BY species
      `);

      // 4. Top 5 Breeds
      const [breeds]: any = await pool.query(`
        SELECT breed as name, COUNT(*) as value
        FROM PetProfile
        WHERE breed IS NOT NULL AND breed != ''
        GROUP BY breed
        ORDER BY value DESC
        LIMIT 5
      `);

      // 5. Cases by Location (City)
      const [locations]: any = await pool.query(`
        SELECT l.city as loc, COUNT(*) as val
        FROM CaseTable c
        JOIN Location l ON c.location_id = l.location_id
        GROUP BY l.city
        ORDER BY val DESC
        LIMIT 6
      `);

      // 6. Average Recovery Time (Days)
      const [recoveryTime]: any = await pool.query(`
        SELECT AVG(DATEDIFF(updated_at, report_date)) as avgDays
        FROM CaseTable
        WHERE status = 'RECOVERED'
      `);

      res.json({
        overview: stats[0],
        trends,
        species: species.map((s: any) => {
          const name = String(s.name).toLowerCase();
          let color = '#f59e0b'; // Default Orange
          if (name === 'dog') color = '#f97316'; // Vivid Orange
          if (name === 'cat') color = '#3b82f6'; // Blue
          if (name === 'bird') color = '#a855f7'; // Purple
          return { ...s, color };
        }),
        breeds: breeds.map((b: any, i: number) => ({ 
          ...b, 
          color: ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#64748b'][i] 
        })),
        locations,
        avgRecoveryTime: Math.round((recoveryTime[0].avgDays || 0) * 10) / 10
      });

    } catch (err: any) {
      console.error("Analytics Error:", err);
      res.status(500).json({ error: "Failed to fetch analytics", details: err.message });
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

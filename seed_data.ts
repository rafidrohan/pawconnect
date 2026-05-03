import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT)
});

async function seed() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // 1. Get a reporter (Assuming user_id 1 exists from previous steps)
    const [reporters]: any = await pool.query("SELECT reporter_id FROM Reporter LIMIT 1");
    if (reporters.length === 0) {
      console.error('❌ No reporter found. Please create an account first.');
      process.exit(1);
    }
    const reporterId = reporters[0].reporter_id;

    const locations = ['Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara', 'Banani', 'Badda', 'Bashundhara'];
    const species = ['Dog', 'Cat', 'Bird'];
    const statuses = ['REPORTED', 'UNDER_REVIEW', 'RECOVERED'];
    
    // Create 20 random cases over the last 6 months
    for (let i = 0; i < 20; i++) {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const spec = species[Math.floor(Math.random() * species.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const caseType = status === 'FOUND' ? 'FOUND' : 'LOST';
      
      // Random date in last 6 months
      const date = new Date();
      date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
      const dateStr = date.toISOString().split('T')[0];

      // Insert Location
      const [locRes]: any = await pool.query(
        "INSERT INTO Location (city, area) VALUES (?, ?)",
        [loc, loc]
      );
      const locationId = locRes.insertId;

      // Insert Pet
      const [petRes]: any = await pool.query(
        "INSERT INTO PetProfile (species, breed, gender, age, color) VALUES (?, ?, ?, ?, ?)",
        [spec, 'Mixed', 'MALE', 2, 'Brown']
      );
      const petId = petRes.insertId;

      // Insert Case
      const [caseRes]: any = await pool.query(
        "INSERT INTO CaseTable (pet_id, location_id, reporter_id, status, case_type, description, report_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [petId, locationId, reporterId, status, caseType, `Test case ${i}`, date]
      );
      const caseId = caseRes.insertId;

      // Insert specialized report
      if (status === 'LOST' || status === 'RECOVERED') {
        await pool.query(
          "INSERT INTO LostReport (case_id, date_time, reward) VALUES (?, ?, ?)",
          [caseId, dateStr, 500]
        );
      } else {
        await pool.query(
          "INSERT INTO FoundReport (case_id, date_time, found_condition) VALUES (?, ?, ?)",
          [caseId, dateStr, 'Healthy']
        );
      }

      // Add a dummy photo
      await pool.query(
        "INSERT INTO CasePhoto (case_id, photo_url, is_primary) VALUES (?, ?, ?)",
        [caseId, `https://placehold.co/400x400?text=${spec}+${status}`, 1]
      );
    }

    console.log('✅ Successfully seeded 20 test cases!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();

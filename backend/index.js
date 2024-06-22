import express from 'express';
import mysql from 'mysql2/promise';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ahprank'
};

// Route to handle form submission
app.post('/submit-form', async (req, res) => {
  const { Akreditasi, Biaya, Ranking, Lulusan, Prestasi, Fasilitas } = req.body;
  
  const query = `
    INSERT INTO tingkat_kepentingan (kriteria, bobot) 
    VALUES 
    ('Akreditasi', ?), 
    ('Biaya', ?), 
    ('Ranking', ?), 
    ('Lulusan', ?), 
    ('Prestasi', ?), 
    ('Fasilitas', ?)
    ON DUPLICATE KEY UPDATE
    bobot = VALUES(bobot)
  `;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(query, [Akreditasi, Biaya, Ranking, Lulusan, Prestasi, Fasilitas]);
    await connection.end();
    res.status(200).send('Data saved successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

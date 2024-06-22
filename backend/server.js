import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import AHP from 'ahp';

const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(cors());

// MySQL connection pool configuration
const mysqlPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ahprank',
  connectionLimit: 10  // Adjust this based on your application needs
});

// Function to fetch criteria weights from 'tingkat_kepentingan'
const fetchCriteriaWeights = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    const [rows] = await connection.execute('SELECT kriteria, bobot FROM tingkat_kepentingan');
    connection.release();
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to fetch alternatives data from 'dataset'
const fetchAlternativesData = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM dataset');
    connection.release();
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to insert AHP ranking results into 'skor_akhir'
const insertAHPResults = async (ahpRanking) => {
  try {
    const connection = await mysqlPool.getConnection();
    // Optional: Clear existing scores
    // await connection.execute('TRUNCATE TABLE skor_akhir');
    
    const insertPromises = ahpRanking.map(({ name, score }) => 
      connection.execute('INSERT INTO skor_akhir (kampus, skor) VALUES (?, ?)', [name, score])
    );
    await Promise.all(insertPromises);
    connection.release();
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to calculate AHP ranking
const calculateAHP = (criteriaWeights, alternatives) => {
  const ahpContext = new AHP();

  // Add criteria
  const criteria = criteriaWeights.map(row => row.kriteria);
  ahpContext.addCriteria(criteria);

  // Add pairwise comparisons for criteria based on weights
  const weights = criteriaWeights.map(row => row.bobot);
  ahpContext.rankCriteria(weights);

  // Add pairwise comparisons for alternatives based on each criterion
  criteria.forEach((criterion, index) => {
    const alternativesByCriterion = alternatives.map(row => row[criterion]);
    ahpContext.rankAlternativesByCriteria(criterion, alternativesByCriterion);
  });

  // Perform AHP calculation
  const result = ahpContext.calculate();

  // Extract ranked alternatives with scores
  const rankedAlternatives = result.rankedAlternatives.map(item => ({
    name: item.name,
    score: item.score
  }));

  return rankedAlternatives;
};

// Route to handle form submission and calculate AHP ranking
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
    const connection = await mysqlPool.getConnection();
    await connection.execute(query, [Akreditasi, Biaya, Ranking, Lulusan, Prestasi, Fasilitas]);
    connection.release();
    res.status(200).send('Data saved successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Route to calculate and store AHP ranking results in 'skor_akhir' table
app.post('/ahp-ranking', async (req, res) => {
  try {
    const criteriaWeights = await fetchCriteriaWeights();
    const alternatives = await fetchAlternativesData();
    
    const ahpRanking = calculateAHP(criteriaWeights, alternatives);

    await insertAHPResults(ahpRanking);

    res.status(200).json(ahpRanking);

    
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Hasil Peringkat AHP:', ahpRanking);
});

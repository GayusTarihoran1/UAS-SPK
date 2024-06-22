import express from 'express';
import mysql from 'mysql2/promise';
import bodyParser from 'body-parser';
import cors from 'cors';
// Function to insert AHP ranking results into 'skor_akhir'
const insertAHPResults = async (ahpRanking) => {
    try {
      const connection = await pool.getConnection();
      
      // Clear existing scores in 'skor_akhir'
      await connection.execute('TRUNCATE TABLE skor_akhir');
      
      // Insert new scores from AHP ranking
      const insertPromises = ahpRanking.map(({ name, score }) =>
        connection.execute('INSERT INTO skor_akhir (kampus, skor) VALUES (?, ?)', [name, score])
      );
      
      // Execute all insert queries concurrently
      await Promise.all(insertPromises);
      
      connection.release(); // Release the connection back to the pool
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
  
  // Route to calculate and store AHP ranking results in 'skor_akhir' table
  app.get('/ahp-ranking', async (req, res) => {
    try {
      const criteriaWeights = await fetchCriteriaWeights();
      const alternatives = await fetchAlternativesData();
  
      // Perform AHP ranking calculation
      const ahp = new AHP(criteriaWeights, alternatives);
      const ahpRanking = ahp.calculate();
  
      // Insert AHP ranking results into 'skor_akhir' table
      await insertAHPResults(ahpRanking);
  
      // Send response with AHP ranking results
      res.status(200).json(ahpRanking);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  });
  
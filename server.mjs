import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// API route for fetching popular celebrities
app.get('/api/popular', async (req, res) => {
  const page = req.query.page || 1;
  const apiKey = "03e45d3366239d51312ebe66975fded3";
  const url = `https://api.themoviedb.org/3/person/popular?api_key=03e45d3366239d51312ebe66975fded3&page=${page}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data from TMDb" });
  }
});

app.get('/api/person/:id', async (req, res) => {
  const id = req.params.id;
  const url = `https://api.themoviedb.org/3/person/${id}?api_key=03e45d3366239d51312ebe66975fded3`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data from TMDb API:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

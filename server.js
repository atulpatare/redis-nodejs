import express from "express";
import axios from "axios";
import redis from "redis";

const redisClient = redis.createClient(); // connects to local client
redisClient.on("error", (error) => console.err(error));
redisClient.connect();

const app = express();
const port = process.env.PORT || 3000;

const fetchApiData = async (species) => {
  const url = `https://www.fishwatch.gov/api/species/${species}`;
  const apiResponse = await axios.get(url);
  return apiResponse.data;
}

app.get("/fish/:species", async (req, res) => {
  const species = req.params.species;
  const cacheResults = await redisClient.get(species);
  if (cacheResults) {
    res.send({ fromCache: true, data: JSON.parse(cacheResults) });
    return;
  }
  const results = await fetchApiData(species);
  redisClient.set(species, JSON.stringify(results), {
    EX: 180,
    NX: true,
  });
  res.send({
    fromCache: false,
    data: results,
  });
});

app.listen(port, () => console.log("App listening on port ", port));

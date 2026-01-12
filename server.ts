import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import http from "http";
import https from "https";
import ViteExpress from "vite-express";

dotenv.config();

const PORT = process.env.PORT ?? "3000";
const SSL_PORT = process.env.SSL_PORT;
const SSL_KEY = process.env.SSL_KEY;
const SSL_CERT = process.env.SSL_CERT;

const games: Record<string, string> = {};

const app = express();
app.use(express.json());

app.post("/get_game", (req, res) => {
  if (!req.body.uuid) {
    return res.status(400).send("UUID is required");
  }

  res.status(200).json({
    game: games[req.body.uuid] ?? "null",
  });
});

app.post("/set_game", (req, res) => {
  if (!req.body.uuid) {
    return res.status(400).send("UUID is required");
  }

  games[req.body.uuid] = req.body.game ?? "null";

  res.status(200).json({
    message: "Game set successfully",
  });
});

const httpServer = http.createServer(app);

httpServer.listen(parseInt(PORT), "0.0.0.0", () => {
  console.log(`HTTP server is listening on port ${PORT}`);
});

if (SSL_PORT && SSL_KEY && SSL_CERT) {
  const options = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT),
  };

  const httpsServer = https.createServer(options, app);

  httpsServer.listen(parseInt(SSL_PORT), "0.0.0.0", () => {
    console.log(`HTTPS server is listening on port ${SSL_PORT}`);
  });

  ViteExpress.bind(app, httpsServer);
} else {
  ViteExpress.bind(app, httpServer);
}

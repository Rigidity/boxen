import express from "express";
import ViteExpress from "vite-express";

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

ViteExpress.listen(app, 3000, () => console.log("Server is listening..."));

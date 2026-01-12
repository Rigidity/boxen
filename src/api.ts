export async function downloadGame(uuid: string): Promise<string> {
  const response = await fetch("/get_game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uuid }),
  });
  if (response.status !== 200) throw new Error("Failed to download game");
  const result = await response.json();
  return result.game;
}

export async function uploadGame(uuid: string, game: string): Promise<void> {
  const response = await fetch("/set_game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uuid, game }),
  });
  if (response.status !== 200) throw new Error("Failed to upload game");
}

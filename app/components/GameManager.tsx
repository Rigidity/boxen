"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { v4 as uuidv4 } from "uuid";
import {
  getGameState,
  joinGame,
  restartGame,
  startGame,
  updateGame,
} from "../api";
import { Color, Game, Position } from "../engine/game";
import { GameCanvas } from "./GameCanvas";

export function GameManager() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [game, setGame] = useState<Game | null>(null);
  const [upgradePositions, setUpgradePositions] = useState<Position[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState(Color.Red);
  const [myColor, setMyColor] = useState(Color.Red);
  const [participantId, setParticipantId] = useLocalStorage<string | null>(
    "participantId",
    null,
  );
  const [resetOpen, setResetOpen] = useState(false);

  const uuid = useMemo(() => searchParams.get("uuid"), [searchParams]);

  const loadGame = (
    newGame: Game,
    newActiveColor: Color,
    newMyColor: Color,
    newIsPlaying: boolean,
  ) => {
    setGame(newGame);
    setActiveColor(newActiveColor);
    setMyColor(newMyColor);
    setUpgradePositions([]);
    setIsPlaying(newIsPlaying);
  };

  useEffect(() => {
    if (!participantId) {
      setParticipantId(uuidv4());
    }
  }, [participantId, setParticipantId]);

  useEffect(() => {
    if (!participantId) return;

    if (uuid) {
      joinGame(participantId, uuid).then((response) => {
        if ("error" in response) {
          console.error(response.error);

          const params = new URLSearchParams(searchParams.toString());
          params.delete("uuid");
          router.push(`${pathname}?${params.toString()}`);
        } else {
          const newActiveColor = response.yourColor ?? Color.Red;
          const newGame = new Game(newActiveColor);
          newGame.setBoard(response.board);
          loadGame(
            newGame,
            response.activeColor,
            newActiveColor,
            response.yourColor !== null,
          );
        }
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGame(null);
    }
  }, [uuid, participantId, pathname, router, searchParams]);

  useEffect(() => {
    if (!uuid || !participantId) return;
    if (isPlaying && activeColor === myColor) return;

    const interval = setInterval(async () => {
      const response = await getGameState(uuid, participantId);

      if ("error" in response) {
        console.error(response.error);
      } else if (game) {
        setActiveColor(response.activeColor);
        setMyColor(response.yourColor ?? Color.Red);
        game.setBoard(response.board);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [uuid, activeColor, myColor, isPlaying, game, participantId]);

  const passTurn = async () => {
    if (!participantId || !isPlaying || !uuid || !game) return;

    const response = await updateGame(participantId, uuid, game.getBoard());

    if ("error" in response) {
      console.error(response.error);
    } else {
      setActiveColor(response.activeColor);
    }
  };

  const onCellClick = (x: number, y: number) => {
    if (!game || !isPlaying) return;

    if (upgradePositions.length === 0) {
      if (game.canPlaceRing(x, y)) {
        const newUpgradePositions = game.placeRing(x, y);
        if (!newUpgradePositions.length) passTurn();
        setUpgradePositions(newUpgradePositions);
      }
    } else {
      for (const upgradePosition of upgradePositions) {
        if (upgradePosition.x === x && upgradePosition.y === y) {
          const newUpgradePositions = game.upgrade({ x, y });
          if (!newUpgradePositions.length) passTurn();
          setUpgradePositions(newUpgradePositions);
          break;
        }
      }
    }
  };

  const newGame = async () => {
    if (!participantId) return;

    const response = await startGame(participantId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("uuid", response.uuid);
    router.push(`${pathname}?${params.toString()}`);

    const newGame = new Game(Color.Red);
    newGame.setBoard(response.board);
    loadGame(newGame, response.activeColor, Color.Red, true);
  };

  const resetGame = async () => {
    setResetOpen(false);

    if (!participantId || !uuid) return;

    const response = await restartGame(participantId, uuid);

    if ("error" in response) {
      console.error(response.error);
    } else {
      const newGame = new Game(Color.Red);
      newGame.setBoard(response.board);
      loadGame(newGame, response.activeColor, response.yourColor, true);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        {game && isPlaying ? (
          <Button className="cursor-pointer" onClick={() => setResetOpen(true)}>
            Reset Game
          </Button>
        ) : (
          <Button className="cursor-pointer" onClick={() => newGame()}>
            New Game
          </Button>
        )}
      </div>

      {game && (
        <GameCanvas
          game={game}
          myColor={myColor}
          activeColor={activeColor}
          upgradePositions={upgradePositions}
          onCellClick={onCellClick}
        />
      )}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to reset the game?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. It will clear the board and start a
              new game with the opposite player starting as red.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => resetGame()}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

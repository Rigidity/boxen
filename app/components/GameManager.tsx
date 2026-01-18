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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCwIcon } from "lucide-react";
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
import {
  Board,
  canPlaceRing,
  getCellAt,
  getUpgradePositions,
  placeRing,
  upgrade,
} from "../engine/board";
import { Color, getCellColor } from "../engine/cell";
import { Position } from "../engine/position";
import { DEFAULT_SETTINGS } from "../engine/settings";
import { GameCanvas } from "./GameCanvas";

export function GameManager() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [originPosition, setOriginPosition] = useState<Position | null>(null);
  const [upgradePositions, setUpgradePositions] = useState<Position[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState(Color.Red);
  const [myColor, setMyColor] = useState(Color.Red);
  const [participantId, setParticipantId] = useLocalStorage<string | null>(
    "participantId",
    null,
  );

  const [boardSizeSetting, setBoardSizeSetting] = useState(
    DEFAULT_SETTINGS.size.toString(),
  );
  const [minimumCombineLengthSetting, setMinimumCombineLengthSetting] =
    useState(DEFAULT_SETTINGS.minimumCombineLength.toString());
  const [allowDiagonalPlacementSetting, setAllowDiagonalPlacementSetting] =
    useState(DEFAULT_SETTINGS.allowDiagonalPlacement);
  const [fixedStartSetting, setFixedStartSetting] = useState(
    DEFAULT_SETTINGS.fixedStart,
  );
  const [autoUpgradeSetting, setAutoUpgradeSetting] = useState(
    DEFAULT_SETTINGS.autoUpgrade,
  );
  const [ruinsSetting, setRuinsSetting] = useState(DEFAULT_SETTINGS.ruins);

  const [startOpen, setStartOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const uuid = useMemo(() => searchParams.get("uuid"), [searchParams]);

  const loadGame = (
    newBoard: Board,
    newActiveColor: Color,
    newMyColor: Color,
    newIsPlaying: boolean,
  ) => {
    setBoard(newBoard);
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
          console.log(response.error);

          const params = new URLSearchParams(searchParams.toString());
          params.delete("uuid");
          router.push(`${pathname}?${params.toString()}`);
        } else {
          const newActiveColor = response.yourColor ?? Color.Red;
          loadGame(
            response.board,
            response.activeColor,
            newActiveColor,
            response.yourColor !== null,
          );
        }
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBoard(null);
    }
  }, [uuid, participantId, pathname, router, searchParams]);

  useEffect(() => {
    if (!uuid || !participantId) return;
    if (isPlaying && activeColor === myColor) return;

    const interval = setInterval(async () => {
      const response = await getGameState(uuid, participantId);

      if ("error" in response) {
        console.log(response.error);
      } else if (board) {
        setActiveColor(response.activeColor);
        setMyColor(response.yourColor ?? Color.Red);
        setBoard(response.board);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [uuid, activeColor, myColor, isPlaying, board, participantId]);

  const passTurn = async () => {
    if (!participantId || !isPlaying || !uuid || !board) return;

    const response = await updateGame(participantId, uuid, board);

    if ("error" in response) {
      console.log(response.error);
    } else {
      setActiveColor(response.activeColor);
      setOriginPosition(null);
      setUpgradePositions([]);
    }
  };

  const onCellClick = (x: number, y: number) => {
    if (!board || !isPlaying) return;

    if (upgradePositions.length === 0) {
      if (canPlaceRing(board, { x, y }, myColor)) {
        placeRing(board, { x, y }, myColor);

        if (board.settings.autoUpgrade) {
          const newUpgradePositions = getUpgradePositions(board, { x, y });

          if (!newUpgradePositions.length) {
            passTurn();
          } else {
            setUpgradePositions(newUpgradePositions);
            setOriginPosition({ x, y });
          }
        } else {
          passTurn();
        }
      } else {
        const cell = getCellAt(board, { x, y });

        if (getCellColor(cell) === myColor && !board.settings.autoUpgrade) {
          const newUpgradePositions = getUpgradePositions(board, { x, y });

          if (newUpgradePositions.length) {
            setUpgradePositions(newUpgradePositions);
            setOriginPosition({ x, y });
          }
        }
      }
    } else {
      for (const upgradePosition of upgradePositions) {
        if (
          upgradePosition.x === x &&
          upgradePosition.y === y &&
          originPosition
        ) {
          upgrade(board, originPosition, { x, y });

          if (board.settings.autoUpgrade) {
            const newUpgradePositions = getUpgradePositions(board, { x, y });

            if (!newUpgradePositions.length) {
              passTurn();
            } else {
              setUpgradePositions(newUpgradePositions);
              setOriginPosition({ x, y });
            }
          } else {
            passTurn();
          }
          break;
        }
      }
    }
  };

  const newGame = async () => {
    setStartOpen(false);

    if (!participantId) return;

    const response = await startGame(
      participantId,
      {
        size: parseInt(boardSizeSetting),
        minimumCombineLength: parseInt(minimumCombineLengthSetting),
        allowDiagonalPlacement: allowDiagonalPlacementSetting,
        fixedStart: fixedStartSetting,
        autoUpgrade: autoUpgradeSetting,
        ruins: ruinsSetting,
      },
      Color.Red,
    );

    const params = new URLSearchParams(searchParams.toString());
    params.set("uuid", response.uuid);
    router.push(`${pathname}?${params.toString()}`);

    loadGame(response.board, response.activeColor, Color.Red, true);
  };

  const resetGame = async () => {
    setResetOpen(false);

    if (!participantId || !uuid) return;

    const response = await restartGame(participantId, uuid);

    if ("error" in response) {
      console.log(response.error);
    } else {
      loadGame(response.board, response.activeColor, response.yourColor, true);
    }
  };

  const closeGame = async () => {
    setCloseOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("uuid");
    router.push(`${pathname}?${params.toString()}`);

    setBoard(null);
    setOriginPosition(null);
    setUpgradePositions([]);
    setIsPlaying(false);
    setActiveColor(Color.Red);
    setMyColor(Color.Red);
  };

  return (
    <div>
      <div className="flex gap-2">
        {board && isPlaying ? (
          <>
            <Button
              className="cursor-pointer"
              onClick={() => setResetOpen(true)}
            >
              Reset Game
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => setCloseOpen(true)}
            >
              Close Game
            </Button>
          </>
        ) : (
          <Button className="cursor-pointer" onClick={() => setStartOpen(true)}>
            New Game
          </Button>
        )}
      </div>

      {board && (
        <GameCanvas
          board={board}
          myColor={myColor}
          activeColor={activeColor}
          upgradePositions={upgradePositions}
          onCellClick={onCellClick}
        />
      )}

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Game</DialogTitle>
            <DialogDescription className="text-left">
              You will start as red. You can change the settings below if
              desired.
            </DialogDescription>

            <div className="flex flex-col gap-2 my-2">
              <div className="grid w-full max-w-sm items-center gap-2">
                <div className="flex gap-2 h-4">
                  <Label>Board Size</Label>
                  {boardSizeSetting !== DEFAULT_SETTINGS.size.toString() && (
                    <RefreshCwIcon
                      className="w-4 h-4 cursor-pointer"
                      onClick={() =>
                        setBoardSizeSetting(DEFAULT_SETTINGS.size.toString())
                      }
                    />
                  )}
                </div>
                <Input
                  type="number"
                  value={boardSizeSetting}
                  onChange={(e) => setBoardSizeSetting(e.target.value)}
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-2">
                <div className="flex gap-2 h-4">
                  <Label>Minimum Combine Length</Label>
                  {minimumCombineLengthSetting !==
                    DEFAULT_SETTINGS.minimumCombineLength.toString() && (
                    <RefreshCwIcon
                      className="w-4 h-4 cursor-pointer"
                      onClick={() =>
                        setMinimumCombineLengthSetting(
                          DEFAULT_SETTINGS.minimumCombineLength.toString(),
                        )
                      }
                    />
                  )}
                </div>
                <Input
                  type="number"
                  value={minimumCombineLengthSetting}
                  onChange={(e) =>
                    setMinimumCombineLengthSetting(e.target.value)
                  }
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-2">
                <div className="flex gap-2 h-4">
                  <Label>Allow Diagonal Placement</Label>
                  {allowDiagonalPlacementSetting !==
                    DEFAULT_SETTINGS.allowDiagonalPlacement && (
                    <RefreshCwIcon
                      className="w-4 h-4 cursor-pointer"
                      onClick={() =>
                        setAllowDiagonalPlacementSetting(
                          DEFAULT_SETTINGS.allowDiagonalPlacement,
                        )
                      }
                    />
                  )}
                </div>
                <Switch
                  checked={allowDiagonalPlacementSetting}
                  onCheckedChange={setAllowDiagonalPlacementSetting}
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-2">
                <div className="flex gap-2 h-4">
                  <Label>Fixed Starting Position</Label>
                  {fixedStartSetting !== DEFAULT_SETTINGS.fixedStart && (
                    <RefreshCwIcon
                      className="w-4 h-4 cursor-pointer"
                      onClick={() =>
                        setFixedStartSetting(DEFAULT_SETTINGS.fixedStart)
                      }
                    />
                  )}
                </div>
                <Switch
                  checked={fixedStartSetting}
                  onCheckedChange={setFixedStartSetting}
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-2">
                <div className="flex gap-2 h-4">
                  <Label>Auto Upgrade</Label>
                  {autoUpgradeSetting !== DEFAULT_SETTINGS.autoUpgrade && (
                    <RefreshCwIcon
                      className="w-4 h-4 cursor-pointer"
                      onClick={() =>
                        setAutoUpgradeSetting(DEFAULT_SETTINGS.autoUpgrade)
                      }
                    />
                  )}
                </div>
                <Switch
                  checked={autoUpgradeSetting}
                  onCheckedChange={setAutoUpgradeSetting}
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-2">
                <div className="flex gap-2 h-4">
                  <Label>Ruins</Label>
                  {ruinsSetting !== DEFAULT_SETTINGS.ruins && (
                    <RefreshCwIcon
                      className="w-4 h-4 cursor-pointer"
                      onClick={() => setRuinsSetting(DEFAULT_SETTINGS.ruins)}
                    />
                  )}
                </div>
                <Switch
                  checked={ruinsSetting}
                  onCheckedChange={setRuinsSetting}
                />
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => newGame()}>Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to close the game?</DialogTitle>
            <DialogDescription>
              You can return to it later by entering the same game URL.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => closeGame()}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

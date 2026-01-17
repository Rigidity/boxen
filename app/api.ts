"use server";

import { v4 as uuidv4 } from "uuid";
import { Board, Color, Game, oppositeColor } from "./engine/game";

interface GameState {
  board: Board;
  activeColor: Color;
  participantIds: string[];
}

const games: Record<string, GameState> = {};

export async function startGame(participantId: string): Promise<{
  uuid: string;
  board: Board;
  activeColor: Color;
}> {
  const uuid = uuidv4();

  const game = new Game(Color.Red);

  const gameState: GameState = {
    board: game.getBoard(),
    activeColor: Color.Red,
    participantIds: [participantId],
  };

  games[uuid] = gameState;

  return {
    uuid,
    board: gameState.board,
    activeColor: gameState.activeColor,
  };
}

export async function joinGame(
  participantId: string,
  uuid: string,
): Promise<
  | { error: string }
  | {
      board: Board;
      activeColor: Color;
      yourColor: Color | null;
    }
> {
  const gameState = games[uuid];
  if (!gameState) return { error: "Unknown game" };

  let isParticipant = gameState.participantIds.includes(participantId);

  if (!isParticipant && gameState.participantIds.length < 2) {
    gameState.participantIds.push(participantId);
    isParticipant = true;
  }

  return {
    board: gameState.board,
    activeColor: gameState.activeColor,
    yourColor: isParticipant
      ? gameState.participantIds.indexOf(participantId) === 0
        ? Color.Red
        : Color.Black
      : null,
  };
}

export async function getGameState(
  uuid: string,
  participantId: string,
): Promise<
  | { error: string }
  | {
      board: Board;
      activeColor: Color;
      yourColor: Color | null;
    }
> {
  const gameState = games[uuid];
  if (!gameState) return { error: "Unknown game" };

  return {
    board: gameState.board,
    activeColor: gameState.activeColor,
    yourColor: gameState.participantIds.includes(participantId)
      ? gameState.participantIds.indexOf(participantId) === 0
        ? Color.Red
        : Color.Black
      : null,
  };
}

export async function restartGame(
  participantId: string,
  uuid: string,
): Promise<
  | { error: string }
  | {
      board: Board;
      activeColor: Color;
      yourColor: Color;
    }
> {
  const gameState = games[uuid];
  if (!gameState) return { error: "Unknown game" };

  if (!gameState.participantIds.includes(participantId))
    return { error: "You are not a participant in this game" };

  const game = new Game(Color.Red);
  gameState.board = game.getBoard();
  gameState.activeColor = Color.Red;
  gameState.participantIds.reverse();

  return {
    board: gameState.board,
    activeColor: gameState.activeColor,
    yourColor:
      gameState.participantIds.indexOf(participantId) === 0
        ? Color.Red
        : Color.Black,
  };
}

export async function updateGame(
  participantId: string,
  uuid: string,
  board: Board,
): Promise<
  | { error: string }
  | {
      activeColor: Color;
    }
> {
  const gameState = games[uuid];
  if (!gameState) return { error: "Unknown game" };

  if (!gameState.participantIds.includes(participantId))
    return { error: "You are not a participant in this game" };

  const myColor =
    gameState.participantIds.indexOf(participantId) === 0
      ? Color.Red
      : Color.Black;
  if (myColor !== gameState.activeColor) return { error: "It's not your turn" };

  gameState.board = board;
  gameState.activeColor = oppositeColor(myColor);

  return {
    activeColor: gameState.activeColor,
  };
}

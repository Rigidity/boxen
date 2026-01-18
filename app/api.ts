"use server";

import { v4 as uuidv4 } from "uuid";
import { Board, createBoard } from "./engine/board";
import { Color } from "./engine/cell";
import { BoardSettings } from "./engine/settings";

interface GameState {
  board: Board;
  activeColor: Color;
  participants: Participant[];
}

interface Participant {
  id: string;
  color: Color;
}

const games: Record<string, GameState> = {};

export async function startGame(
  participantId: string,
  settings: BoardSettings,
  color: Color,
): Promise<{
  uuid: string;
  board: Board;
  activeColor: Color;
}> {
  const uuid = uuidv4();

  const board = createBoard(settings);

  const gameState: GameState = {
    board,
    activeColor: Color.Red,
    participants: [{ id: participantId, color }],
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

  let isParticipant = gameState.participants.some(
    (participant) => participant.id === participantId,
  );

  if (!isParticipant && gameState.participants.length < 2) {
    gameState.participants.push({
      id: participantId,
      color:
        gameState.participants[0].color === Color.Red ? Color.Black : Color.Red,
    });
    isParticipant = true;
  }

  return {
    board: gameState.board,
    activeColor: gameState.activeColor,
    yourColor:
      gameState.participants.find(
        (participant) => participant.id === participantId,
      )?.color ?? null,
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
    yourColor:
      gameState.participants.find(
        (participant) => participant.id === participantId,
      )?.color ?? null,
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

  if (
    !gameState.participants.some(
      (participant) => participant.id === participantId,
    )
  )
    return { error: "You are not a participant in this game" };

  gameState.board = createBoard(gameState.board.settings);
  gameState.activeColor = Color.Red;

  let color = Color.Red;

  for (const participant of gameState.participants) {
    participant.color =
      participant.color === Color.Red ? Color.Black : Color.Red;

    if (participant.id === participantId) {
      color = participant.color;
    }
  }

  return {
    board: gameState.board,
    activeColor: gameState.activeColor,
    yourColor: color,
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

  const participant = gameState.participants.find(
    (participant) => participant.id === participantId,
  );

  if (!participant) return { error: "You are not a participant in this game" };

  if (gameState.activeColor !== participant.color)
    return { error: "It's not your turn" };

  gameState.board = board;
  gameState.activeColor =
    participant.color === Color.Red ? Color.Black : Color.Red;

  return {
    activeColor: gameState.activeColor,
  };
}

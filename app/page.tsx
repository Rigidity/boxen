import { PropsWithChildren } from "react";
import { GameManager } from "./components/GameManager";

export default function Home() {
  return (
    <div className="flex flex-col items-center p-4 w-[800px] max-w-full mx-auto">
      <h1 className="text-5xl mt-4">Boxen</h1>

      <p className="text-xl mt-2">Game not started yet</p>

      <div className="mt-6">
        <GameManager />
      </div>

      <div className="flex flex-col gap-4 mt-6">
        <Instruction>
          When it's your turn, place a ring on the board adjacent to other
          objects with your color (or anywhere, if you don't have any objects on
          the board). When you've placed 3 rings in a row, you must combine them
          into a tower. And likewise, 3 towers make a laser.
        </Instruction>

        <Instruction>
          Towers will prevent the enemy from having objects adjacent to them in
          any direction (including diagonally). Lasers protect an entire row and
          column, making them very powerful at boxing your opponent in.
        </Instruction>

        <Instruction>
          The goal of the game is to prevent your opponent from being able to
          place any objects on the board.
        </Instruction>
      </div>
    </div>
  );
}

function Instruction({ children }: PropsWithChildren<object>) {
  return <div className="w-full">{children}</div>;
}

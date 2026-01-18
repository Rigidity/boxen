import { PropsWithChildren } from "react";
import { GameManager } from "./components/GameManager";

export default function Home() {
  return (
    <div className="flex flex-col items-center p-6 w-[600px] max-w-full mx-auto">
      <h1 className="text-5xl mt-4">Boxen</h1>

      <div className="mt-10">
        <GameManager />
      </div>

      <div className="flex flex-col gap-6 mt-6">
        <Instruction title="Place Rings">
          <p>
            Every turn, you must place a ring on an empty cell adjacent to your
            color. The exception to this is that if you don't have anything on
            the board, you may place a ring on any empty cell.
          </p>
          <p>
            You cannot place a ring in a cell that is defended by a tower or
            laser.
          </p>
        </Instruction>

        <Instruction title="Upgrade">
          <p>
            If you have 3 or more rings in a row, you can upgrade them into a
            tower. Similarly, if you have 3 or more towers in a row, you can
            upgrade them into a laser.
          </p>

          <p>
            Upgrading will destroy any number of cells of the same type in both
            the row and column of the origin (the cell you started the upgrade
            from). Any of the cells that were removed can be replaced with the
            upgraded object.
          </p>
        </Instruction>

        <Instruction title="Defend Cells">
          <p>
            A tower will destroy the 8 cells adjacent to it (including corners)
            and prevent the enemy from placing a ring in any of those cells.
          </p>

          <p>
            Similarly, a laser will destroy all cells in its row and column and
            prevent the enemy from placing a ring in any of those cells.
          </p>

          <p>
            Towers are the only way to destroy lasers, and lasers are the only
            way to destroy towers.
          </p>
        </Instruction>

        <Instruction title="The Goal">
          The goal of the game is to prevent your opponent from being able to
          make a move. Note that removing all of their objects will allow them
          to place a ring on any empty cell.
        </Instruction>
      </div>
    </div>
  );
}

function Instruction({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

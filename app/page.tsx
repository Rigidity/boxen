import { PropsWithChildren } from "react";
import { GameManager } from "./components/GameManager";
import { ThemeToggle } from "./components/ThemeToggle";

export default function Home() {
  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold mb-4">Boxen</h1>
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
              A strategic game of rings, towers, and lasers
            </p>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="bg-card border rounded-lg p-6 w-full">
              <GameManager />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">How to Play</h2>

              <div className="flex flex-col gap-6">
                <Instruction title="Place Rings">
                  <p>
                    Every turn, you must place a ring on an empty cell adjacent
                    to your color. The exception to this is that if you
                    don&apos;t have anything on the board, you may place a ring
                    on any empty cell.
                  </p>
                  <p>
                    You cannot place a ring in a cell that is defended by a
                    tower or laser.
                  </p>
                </Instruction>

                <Instruction title="Upgrade">
                  <p>
                    If you have 3 or more rings in a row, you can upgrade them
                    into a tower. Similarly, if you have 3 or more towers in a
                    row, you can upgrade them into a laser.
                  </p>

                  <p>
                    Upgrading will destroy any number of cells of the same type
                    in both the row and column of the origin (the cell you
                    started the upgrade from). Any of the cells that were
                    removed can be replaced with the upgraded object.
                  </p>
                </Instruction>

                <Instruction title="Defend Cells">
                  <p>
                    A tower will destroy the 8 cells adjacent to it (including
                    corners) and prevent the enemy from placing a ring in any of
                    those cells.
                  </p>

                  <p>
                    Similarly, a laser will destroy all cells in its row and
                    column and prevent the enemy from placing a ring in any of
                    those cells.
                  </p>

                  <p>
                    Towers are the only way to destroy lasers, and lasers are
                    the only way to destroy towers.
                  </p>
                </Instruction>

                <Instruction title="Win Condition">
                  The goal of the game is to prevent your opponent from being
                  able to make a move. Note that removing all of their objects
                  will allow them to place a ring on any empty cell.
                </Instruction>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Legend</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-4 border-red-600"></div>
                  <span className="text-sm">Ring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-red-600"></div>
                  <span className="text-sm">Tower</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-600"></div>
                  <span className="text-sm">Laser</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-500"></div>
                  <span className="text-sm">Ruins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Instruction({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="flex flex-col gap-2 text-muted-foreground text-sm">
        {children}
      </div>
    </div>
  );
}

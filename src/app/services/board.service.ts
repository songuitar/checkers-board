import {Injectable} from '@angular/core';
import {SelectedCell} from "./cell-selector.service";


export enum Figure {
  empty = 0,
  black = 1,
  white = 2,
  blackKing = 10,
  whiteKing = 20,
}

export enum FigureType {
  black = 1,
  white = 2,
}

export interface DiagonalItem {
  d: number,
  value: number
}

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  readonly fullBoardFigureAmount = 24;

  boardInitialState = [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0]
  ]


  moveFigures(state: number[][], from: SelectedCell, to: SelectedCell): number[][] {
    return state.map((row, rowIndex) => row.map((cell, cellIndex) => {
      if (rowIndex === from.y && cellIndex === from.x) {
        return Figure.empty
      }
      if (rowIndex === to.y && cellIndex === to.x) {
        return from.figure
      }
      return cell
    }))
  }

  validateMove(from: SelectedCell, to: SelectedCell): boolean {
    const moveDir = this.getFigureType(from.figure) === FigureType.black ? 1 : -1;
    const XDiff = (from.x - to.x) * moveDir;
    const YDiff = (from.y - to.y) * moveDir;

    if (Math.abs(XDiff / YDiff) !== 1) {
      return false
    }

    return true
  }

  isBlackCell(rowIndex: number, cellIndex: number): boolean {
    const offset = rowIndex % 2 === 0 ? 0 : 1;
    return (cellIndex + offset) % 2 !== 0
  }

  isStateValid(state: number[][]): boolean {
    return this.stateSum(state.map(row => row.map(cell => cell > 0 ? 1 : 0))) <= this.fullBoardFigureAmount && state.filter((row, rowIndex) =>
      row.filter((cell, cellIndex) =>
        !this.isBlackCell(rowIndex, cellIndex) && cell !== Figure.empty).length > 0).length === 0
  }

  isBoardSumDecreasing(prevState: number[][], currState: number[][]): boolean {
    return this.stateSum(prevState) >= this.stateSum(currState);
  }

  isPositionChangedForPlayer(prevState: number[][], currState: number[][], player: Figure): boolean {
    return this.statePrintForPlayer(prevState, player) !== this.statePrintForPlayer(currState, player);
  }

  isNecessaryCapturePerformed(prevState: number[][], currState: number[][]): boolean {
    let prevDiagonals = this.scanDiagonal(prevState);

    let subjectDiagonals: { d: number, sum: number }[] = [];
    Object.values(prevDiagonals).forEach(
      (diagonal) => {
        diagonal.forEach(((value, index, array) => {
          if (array[index - 2] === undefined) {
            return
          }
          const pattern = [array[index - 2].value, array[index - 1].value, array[index].value]

          if (pattern.filter(figure => figure !== Figure.empty).length !== 2) {
            return
          }
          if ((pattern[0] !== pattern[1] && pattern[2] === Figure.empty) || (pattern[1] !== pattern[2] && pattern[0] === Figure.empty)) {
            subjectDiagonals.push({d: value.d, sum: this.diagonalSum(diagonal)})
          }
        }))
      }
    )
    if (subjectDiagonals.length === 0) {
      return true;
    }
    let isCapturePerformed = false;
    let currDiagonals = this.scanDiagonal(currState);

    Object.values(currDiagonals).forEach(
      (diagonal) => {
        const subjectDiagonal = subjectDiagonals.filter(value => value.d === diagonal[0].d).shift()
        if (subjectDiagonal === undefined) {
          return
        }
        if (this.diagonalSum(diagonal) < subjectDiagonal.sum) {
          isCapturePerformed = true
        }
      }
    )

    return isCapturePerformed;
  }

  diagonalSum(diagonal: DiagonalItem[]): number {
    return diagonal.map(({value}) => value).reduce((b, a) => b + a, 0)
  }

  scanDiagonal(state: number[][]) {
    const diagonalTable: { [d: string]: DiagonalItem[] } = {}
    for (let d = 0; d <= 10; d = d + 2) {
      let y = d < 5 ? 5 - d : 0
      let x = d < 5 ? 0 : d - 5
      while (state[y] !== undefined && state[y][x] !== undefined) {
        if (diagonalTable[d] === undefined) {
          diagonalTable[d] = []
          continue
        }
        diagonalTable[d].push({d, value: state[y][x]})
        x++
        y++
      }
    }
    return diagonalTable
  }

  changedIndexes(prev: number[][], curr: number[][]) {
    const prevIndexMap = prev.flat()
    const currIndexMap = curr.flat()

    const changedIndexes: {x: number, y: number, value: number}[] = []

    prevIndexMap.forEach(((value, index) => {
      if (value !== currIndexMap[index]) {
        changedIndexes.push({
          x:index % 8,
          y:((index - index % 8) / 8),
          value
        })
      }
    }))
    return changedIndexes;
  }

  stateSum(state: number[][]): number {
    // @ts-ignore
    return state.flat().reduce((b, a) => b + a, 0);
  }

  statePrint(state: number[][]): string {
    return state.flat()
      .map((elem, index) => elem !== 0 ? index : 0)
      .join('.')
  }

  statePrintForPlayer(state: number[][], player: Figure): string {
    return state.flat()
      .map((elem) => elem === player || elem === Number(String(player) + '0') ? elem : Figure.empty)
      .map((elem, index) => elem !== 0 ? index : 0)
      .join('.')
  }

  getFigureType(figure: Figure): FigureType {
    if (figure === Figure.empty) {
      throw 'Cannot determine type of an empty figure'
    }
    return (figure === Figure.black || figure / 10 === Figure.black) ? FigureType.black : FigureType.white;
  }
}

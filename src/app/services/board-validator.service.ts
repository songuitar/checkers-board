import {Injectable} from '@angular/core';
import {Observable} from "rxjs";

export enum Figure {
  empty = 0,
  black = 1,
  white = 2,
  blackKing = 10,
  whiteKing = 20,
}

export interface DiagonalItem {
  d: number, value: number
}

@Injectable({
  providedIn: 'root'
})
export class BoardValidatorService {

  readonly fullBoardFigureAmount = 24;

  isBlackCell(rowIndex: number, cellIndex: number): boolean {
    const offset = rowIndex % 2 === 0 ? 0 : 1;
    return (cellIndex + offset) % 2 !== 0
  }

  isStateValid(state: number[][]): boolean {
    return this.stateSum(this.equalizeFigureValues(state)) <= this.fullBoardFigureAmount && state.filter((row, rowIndex) =>
      row.filter((cell, cellIndex) =>
        !this.isBlackCell(rowIndex, cellIndex) && cell !== Figure.empty).length > 0).length === 0
  }

  isMoveValid(prevState: number[][], currState: number[][]): boolean {
    const prevSum = this.stateSum(prevState)
    return prevSum === 0 || prevSum >= this.stateSum(currState);
  }

  isNecessaryCapturePerformed(prevState: number[][], currState: number[][]): boolean {
    let prevDiagonals = this.scanDiagonal(prevState);

    let diagonalWithPotentialCapture: {d: number, sum: number}|null = null;
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
           diagonalWithPotentialCapture = {d: value.d, sum: this.diagonalSum(diagonal)}
         }
       }))
      }
    )
    if (diagonalWithPotentialCapture === null) {
      return true;
    }
    let isCapturePerformed = false;
    let currDiagonals = this.scanDiagonal(currState);

    Object.values(currDiagonals).forEach(
      (diagonal) => {
        if (diagonal[0].d !== diagonalWithPotentialCapture?.d) {
          return
        }
        if (this.diagonalSum(diagonal) < diagonalWithPotentialCapture?.sum) {
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

  stateSum(state: number[][]): number {
    // @ts-ignore
    return state.flat().reduce((b, a) => b + a, 0);
  }

  private equalizeFigureValues(state: number[][]): number[][] {
    return state.map(row => row.map(cell => cell > 0 ? 1 : 0))
  }
}

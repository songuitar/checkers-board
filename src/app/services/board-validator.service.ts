import {Injectable} from '@angular/core';

export enum Figure {
  empty = 0,
  black = 1,
  white = 2
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

  isMoveValid(prevState: Number[][], currState: Number[][]): boolean {
    /**
     * TODO: Проверка на то что пешка была срублена - сканировать доску диагоналями на предмет паттерна x-y-0
     * TODO: и при проверке следующего хода проверять что сумма диагонали уменьшилась
     */
    const prevSum = this.stateSum(prevState)
    return prevSum === 0 || prevSum >= this.stateSum(currState);
  }

  stateSum(state: Number[][]): number {
    // @ts-ignore
    return state.flat().reduce((b, a) => b + a, 0);
  }

  private equalizeFigureValues(state: number[][]): number[][] {
    return state.map(row => row.map(cell => cell > 0 ? 1 : 0))
  }
}

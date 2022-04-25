import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of, pairwise, startWith,
  switchMap,
  switchMapTo,
  tap, throwError,
  timer, withLatestFrom
} from "rxjs";

enum Figure {
  empty = 0,
  black = 1,
  white = 2
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'chess-board';
  // @ts-ignore
  boardState$: Observable<Number[][]>
  validationError$ = new BehaviorSubject<string | null>(null);

  readonly Figure = Figure;
  readonly fullBoardFigureAmount = 24;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.boardState$ = timer(0, 3000).pipe(
      switchMapTo(this.http.get<{ board: Number[][] }>('http://localhost:3000')),
      map((res) => res.board),
      startWith([[]]),
      distinctUntilChanged(((previous, current) => JSON.stringify(previous) === JSON.stringify(current))),
      pairwise(),
      switchMap(([prev, curr]) => {
        if (!this.isStateValid(curr)) {
          this.validationError$.next('board state is not valid')
          return of(curr)
        }

        if (!this.isMoveValid(prev, curr)) {
          this.validationError$.next('last move is not valid')
          return of(curr)
        }

        this.validationError$.next(null)
        return of(curr)
      }),
    )
  }

  isBlackCell(rowIndex: number, cellIndex: number): boolean {
    const offset = rowIndex % 2 === 0 ? 0 : 1;
    return (cellIndex + offset) % 2 !== 0
  }

  private isStateValid(state: Number[][]): boolean {
    return this.stateSum(state) <= this.fullBoardFigureAmount && state.filter((row, rowIndex) =>
      row.filter((cell, cellIndex) =>
        !this.isBlackCell(rowIndex, cellIndex) && cell !== Figure.empty).length > 0).length === 0
  }

  private isMoveValid(prevState: Number[][], currState: Number[][]): boolean {
    const prevSum = this.stateSum(prevState)
    return prevSum ===0 || prevSum >= this.stateSum(currState);
  }

  private stateSum(state: Number[][]): number {
    // @ts-ignore
    return state.flat().reduce((b, a) => b + a, 0);
  }
}

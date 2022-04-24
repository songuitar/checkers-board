import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
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
  defaultBoardState = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ]

  // @ts-ignore
  boardState$: Observable<Number[][]>
  validationError$ = new BehaviorSubject<string | null>(null);

  readonly Figure = Figure;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.boardState$ = timer(0, 1000).pipe(
      switchMapTo(this.http.get<{ board: Number[][] }>('http://localhost:3000')),
      map((res) => res.board),
    //  distinctUntilChanged(((previous, current) => JSON.stringify(previous) === JSON.stringify(current))),
      switchMap(state => {
        if (!this.isStateValid(state)) {
          this.validationError$.next('board state is not valid')
          return of(state)
        }

        this.validationError$.next(null)
        return of(state)
      }),
    )
  }

  isBlackCell(rowIndex: number, cellIndex: number): boolean {
    const offset = rowIndex % 2 === 0 ? 0 : 1;
    return (cellIndex + offset) % 2 !== 0
  }

  private isStateValid(state: Number[][]): boolean {
    return state.filter((row, rowIndex) =>
      row.filter((cell, cellIndex) =>
        !this.isBlackCell(rowIndex, cellIndex) && cell !== Figure.empty).length > 0).length === 0
  }
}

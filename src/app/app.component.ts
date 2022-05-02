import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  of,
  pairwise,
  startWith,
  switchMap,
  switchMapTo,
  timer,
} from "rxjs";
import {BoardValidatorService, Figure} from './services/board-validator.service';

export interface BoardState {
  board: number[][]
  currentPlayer: Figure.black | Figure.white
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'chess-board';
  // @ts-ignore
  boardState$: Observable<number[][]>
  validationError$ = new BehaviorSubject<string | null>(null);

  readonly Figure = Figure;

  constructor(
    private http: HttpClient,
    public boardService: BoardValidatorService
  ) {
  }

  ngOnInit(): void {
    this.boardState$ = timer(0, 10000).pipe(
      switchMapTo(this.http.get<BoardState>('http://localhost:3000')),
      distinctUntilChanged(((previous, current) => JSON.stringify(previous) === JSON.stringify(current))),
      startWith({board:this.boardService.boardInitialState, currentPlayer: Figure.white}),
      pairwise(),
      switchMap(([prevState, currState]) => {
        const prev = prevState.board
        const curr = currState.board

        if (this.boardService.statePrint(curr) === this.boardService.statePrint(this.boardService.boardInitialState)) {
          return of(curr)
        }

        this.boardService.setCurrentPlayer(currState.currentPlayer)

        if (prevState.currentPlayer === currState.currentPlayer) {
          this.validationError$.next('player hasn\'t been changed')
          return of(curr)
        }

        if (!this.boardService.isStateValid(curr)) {
          this.validationError$.next('board state is not valid')
          return of(curr)
        }
        if (!this.boardService.isMoveValid(prev, curr)) {
          this.validationError$.next('last move is not valid')
          return of(curr)
        }

        if (this.boardService.isPositionChangedForPlayer(prev, curr)) {
          this.validationError$.next('the position of current player hasn\'t been changed')
          return of(curr)
        }

        if (!this.boardService.isNecessaryCapturePerformed(prev, curr)) {
          this.validationError$.next('obligatory capture was not performed');
          return of(curr)
        }

        this.validationError$.next(null)
        return of(curr)
      }),
    )
  }


}

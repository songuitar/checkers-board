import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  BehaviorSubject,
  distinctUntilChanged,
  interval,
  map,
  Observable,
  of,
  pairwise,
  shareReplay,
  switchMap,
  switchMapTo,
  tap,
} from "rxjs";
import {BoardValidatorService, Figure} from './services/board-validator.service';
import {CellSelectorService} from "./services/cell-selector.service";

export interface BoardState {
  board: number[][]
  currentPlayer: Figure | null
}

export interface MoveSnapshot {
  prev: number[][],
  curr: number[][]
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
  // @ts-ignore
  moves$: Observable<BoardState>
  // @ts-ignore
  validationError$: Observable<string | null>;

  changeLog$ = new BehaviorSubject<MoveSnapshot[]>([]);
  // @ts-ignore
  changedRowsLog$: Observable<MoveSnapshot>



  private boardStateSubject$ = new BehaviorSubject<BoardState>(
    {board: this.boardService.boardInitialState, currentPlayer: null}
  );

  readonly Figure = Figure;

  constructor(
    private http: HttpClient,
    public boardService: BoardValidatorService,
    public cellSelector: CellSelectorService
  ) {
  }

  onCellSelect(x: number, y: number, figure: Figure): void {
    this.cellSelector.selectCell(x, y, figure)
  }

  ngOnInit(): void {
    interval(2000).pipe(
      // switchMapTo(this.http.get<BoardState>('http://localhost:3000/example-seq')),
      switchMapTo(this.http.get<BoardState>('http://localhost:3000')),
      distinctUntilChanged(((previous, current) => JSON.stringify(previous) === JSON.stringify(current))),
    )
      .subscribe(value => {
        this.boardStateSubject$.next(value)
      })

    this.boardState$ = this.boardStateSubject$.asObservable().pipe(
      map(value => value.board)
    )

    this.validationError$ = this.boardStateSubject$.asObservable().pipe(
      pairwise(),
      switchMap(([prevState, currState]) => {
        //console.log('switchMap', new Date(), currState.currentPlayer)

        const prev = prevState.board
        const curr = currState.board

        if (currState.currentPlayer === null) {
          return of(null)
        }

        if (prevState.currentPlayer === currState.currentPlayer) {
          return of('player hasn\'t been changed')
        }

        if (!this.boardService.isStateValid(curr)) {
          return of('board state is not valid')
        }
        if (!this.boardService.isBoardSumDecreasing(prev, curr)) {
          return of('last move is not valid')
        }

        if (!this.boardService.isPositionChangedForPlayer(prev, curr, currState.currentPlayer)) {
          return of('the position of current player hasn\'t been changed')
        }

        if (!this.boardService.isNecessaryCapturePerformed(prev, curr)) {
          return of('obligatory capture was not performed')
        }

        return of(null)
      }),
      shareReplay(2)
    )

    this.changedRowsLog$ = this.boardState$.pipe(
      pairwise(),
      map(([prev, curr]) => {
        return {
          prev, curr
        }
      }),
      tap(state => {
        let newValue = [...this.changeLog$.value, state]
        newValue = newValue.slice((newValue.length > 5 ? newValue.length - 5 : 0), newValue.length);
        this.changeLog$.next(newValue)
      }),
    )

    this.changedRowsLog$.subscribe()
  }

  moveSnapshotPrint(prev: number[][], curr: number[][]): string {
    //TODO: put it in main pipe and use it to paint affected cells

    return JSON.stringify(this.boardService.changedIndexes(prev, curr))
  }

}

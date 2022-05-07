import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
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
import {BoardService, Figure, FigureType} from './services/board.service';
import {CellSelectorService} from "./services/cell-selector.service";

export interface BoardState {
  board: number[][]
  currentPlayer: Figure | null
}

export interface MoveSnapshot {
  prev: number[][],
  curr: number[][],
  error?: string
}

type playerMode = 'manual' | 'bot'


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
  changedRowsLogSpan$: Observable<MoveSnapshot[]>

  private boardStateSubject$ = new BehaviorSubject<BoardState>(
    {board: this.boardService.boardInitialState, currentPlayer: null}
  );


  readonly playersModeSettings: { black: playerMode, white: playerMode } = {
    black: 'manual',
    white: 'manual'
  }

  readonly Figure = Figure;

  constructor(
    private http: HttpClient,
    public boardService: BoardService,
    public cellSelector: CellSelectorService
  ) {
  }

  onCellSelect(x: number, y: number, figure: Figure): void {
    this.cellSelector.selectCell(x, y, figure)
  }

  onDragEvent(x: number, y: number, figure: Figure): void {
    this.cellSelector.selectCell(x, y, figure)
  }

  onWhiteSelect(): void {
    this.cellSelector.flush()
  }

  ngOnInit(): void {
    //TODO: nest js server with shared modules and validation
    this.cellSelector.triggerValidation = true;

    interval(2000).pipe(
      // switchMapTo(this.http.get<BoardState>('http://localhost:3000/example-seq')),
      switchMapTo(this.http.get<BoardState>('http://localhost:3000')),
      distinctUntilChanged(((previous, current) => JSON.stringify(previous) === JSON.stringify(current))),
    )
      .subscribe(value => {
        // this.boardStateSubject$.next(value)
      })


    this.cellSelector.getSelection().pipe(
      filter(() => this.cellSelector.isFull()),
      filter(selection => {
        // @ts-ignore
        const player = this.boardService.getFigureType(selection?.from.figure) === FigureType.black ? 'black' : 'white'
        return this.playersModeSettings[player] === 'manual'
      }),
      // @ts-ignore
      filter(selection => this.boardService.validateMove(selection.from, selection.to)),
      map(selection => {
        return {
          board: this.boardService.moveFigures(
            // @ts-ignore
            this.boardStateSubject$.value.board, selection.from, selection.to
          ),
          // @ts-ignore
          currentPlayer: selection.from.figure
        }
      }),
      tap(value => this.boardStateSubject$.next(value))
    ).subscribe()


    this.boardState$ = this.boardStateSubject$.asObservable().pipe(
      map(value => value.board)
    )

    this.validationError$ = this.boardStateSubject$.asObservable().pipe(
      pairwise(),
      switchMap(([prevState, currState]) => {
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

    this.changedRowsLogSpan$ = this.boardState$.pipe(
      pairwise(),
      map(([prev, curr]) => ({prev, curr})),
      tap(state => {
        let newValue = [...this.changeLog$.value, state]
        this.changeLog$.next(newValue)
      }),
      map(() => {
        const value = this.changeLog$.value;
        return this.changeLog$.value.slice((value.length > 5 ? value.length - 5 : 0), value.length);
      })
    )
  }

  positionToConventionalFormat(x: number, y: number): string {
    return 'abcdefgh'.toUpperCase()[x] + String('87654321')[y]
  }

  moveSnapshotPrint(prev: number[][], curr: number[][]): string {
    return this.boardService.changedIndexes(prev, curr)
      .map(value => ({...value, pos: this.positionToConventionalFormat(value.x, value.y)}))
      .sort(value => value.value !== Figure.empty ? -1 : 1)
      .map(value => {
        const isTarget = value.value === Figure.empty;
        const isBlack = this.boardService.isBlackFigure(value.value)
        const isKing = this.boardService.isKing(value.value)

        return (!isTarget ? (isBlack ? 'Black' : 'White') : '') +
          ' ' + value.pos + (isKing ? '(King)' : '') + (!isTarget ? ' -> ' : '')
      })
      .join('')
  }

}

import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  of, pairwise, startWith,
  switchMap,
  switchMapTo,
  timer,
} from "rxjs";
import {BoardValidatorService, Figure} from './services/board-validator.service';


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
    this.boardState$ = timer(0, 3000).pipe(
      switchMapTo(this.http.get<{ board: number[][] }>('http://localhost:3000')),
      map((res) => res.board),
      startWith([[]]),
      distinctUntilChanged(((previous, current) => JSON.stringify(previous) === JSON.stringify(current))),
      pairwise(),
      switchMap(([prev, curr]) => {
        if (!this.boardService.isStateValid(curr)) {
          this.validationError$.next('board state is not valid')
          return of(curr)
        }

        if (!this.boardService.isMoveValid(prev, curr)) {
          this.validationError$.next('last move is not valid')
          return of(curr)
        }

        this.validationError$.next(null)
        return of(curr)
      }),
    )
  }


}

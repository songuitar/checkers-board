import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, map, Observable, of, switchMapTo, timer} from "rxjs";

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
  boardState$: Observable<Array<Number[]>>

  readonly blackFigure = 1;
  readonly whiteFigure = 2;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.boardState$ = timer(0, 1000).pipe(
      switchMapTo(this.http.get<{board: Array<Number[]>}>('http://localhost:3000')),
      catchError(error => of({board: this.defaultBoardState})),
      map((res) => res.board)
    )
  }

  isBlackCell(rowIndex: number, cellIndex: number): boolean {
    const offset = rowIndex % 2 === 0 ? 0 : 1;
    return (cellIndex + offset) % 2 !== 0
  }
}

import { Injectable } from '@angular/core';
import {BehaviorSubject, map, Observable} from "rxjs";
import {Figure} from "./board-validator.service";

interface Selection {
  from: SelectedCell
  to?: SelectedCell
}

interface SelectedCell {
  x: number,
  y: number,
  figure: Figure
}

@Injectable({
  providedIn: 'root'
})
export class CellSelectorService {

  private selection$ = new BehaviorSubject<Selection | null>(null);

  selectCell(x: number, y: number, figure: Figure): void {
    if (this.isFull()) {
      this.flush()
      return;
    }

    const cell: SelectedCell = {x, y, figure}
    let selection = this.selection$.value

    if (!selection && figure === Figure.empty) {
      return
    }
    if (selection && figure !== Figure.empty) {
      return
    }
    if (!selection) {
      this.selection$.next({
        from: cell
      })
      return;
    }
    this.selection$.next({...selection, to:cell})
  }

  isFull(): boolean {
    let selection = this.selection$.value
    return !!selection?.from && !!selection?.to
  }

  isSelected(x: number, y: number): Observable<boolean> {
    return this.selection$.asObservable().pipe(
      map(selection => {
        if (!selection) {
          return  false
        }
        return (selection?.to?.x === x && selection?.to?.y === y)
          ||
          (selection?.from?.x === x && selection?.from?.y === y);
      })
    )
  }

  flush(): void {
    this.selection$.next(null)
  }

  getSelection(): Observable<Selection | null> {
    return this.selection$.asObservable()
  }
}

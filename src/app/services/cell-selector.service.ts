import {Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable} from "rxjs";
import {BoardService, Figure} from "./board.service";

export interface SelectionValue {
  from: SelectedCell
  to?: SelectedCell
}

export interface SelectedCell {
  x: number,
  y: number,
  figure: Figure
}

@Injectable({
  providedIn: 'root'
})
export class CellSelectorService {

  public triggerValidation: boolean = false;
  private selection$ = new BehaviorSubject<SelectionValue | null>(null);

  constructor(private boardService: BoardService) {
  }

  selectCell(x: number, y: number, figure: Figure): void {
    if (this.isFull()) {
      this.flush()
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

    selection = {...selection, to:cell}

    if (this.triggerValidation) {
      // @ts-ignore
      if (!this.boardService.validateMove(selection.from, selection.to)) {
        return;
      }
    }

    this.selection$.next(selection)
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

  getSelection(): Observable<SelectionValue | null> {
    return this.selection$.asObservable()
  }
}

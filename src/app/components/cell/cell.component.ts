import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Figure} from "../../services/board.service";


@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css']
})
export class CellComponent {
  @Input() isBlack: boolean = false;
  @Input() figure: Figure = Figure.empty
  @Input() selected: boolean| null = false

  @Output() onSelect = new EventEmitter<{figure: Figure}>()

  Figure = Figure;

  onClick(): void {
    if (!this.isBlack) {
      return
    }
    this.onSelect.emit({figure:this.figure})
  }

}

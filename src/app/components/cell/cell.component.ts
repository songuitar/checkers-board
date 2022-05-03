import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Figure} from "../../services/board-validator.service";
import {CellSelectorService} from "../../services/cell-selector.service";

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css']
})
export class CellComponent {
  @Input() isBlack: boolean = false;
  @Input() figure: Figure = Figure.empty
  @Input() selected: boolean| null = false

 // @Input() y: number;
  //@Input() x: number;

  @Output() onSelect = new EventEmitter<{figure: Figure}>()

  Figure = Figure;

/*  constructor(public cellSelector: CellSelectorService) {
  }*/

  onClick(): void {
    console.log(this.figure)

    if (!this.isBlack) {
      return
    }
    this.onSelect.emit({figure:this.figure})
  }

}

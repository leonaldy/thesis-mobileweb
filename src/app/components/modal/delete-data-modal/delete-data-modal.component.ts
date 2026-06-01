import { Component, Input, input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-delete-data-modal',
  templateUrl: './delete-data-modal.component.html',
  styleUrls: ['./delete-data-modal.component.scss'],
})
export class DeleteDataModalComponent  implements OnInit {
  @Input() message : string | undefined;

  constructor(
    private modalCtrl:ModalController
  ) { }

  ngOnInit() {}

  confirmDelete(){
    this.modalCtrl.dismiss({
      'confirmed':true
    });
  }
  cancelDelete(){
    this.modalCtrl.dismiss({
      'confirmed':false
    });
  }
}

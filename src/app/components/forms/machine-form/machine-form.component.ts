import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DataService } from 'src/app/service/data.service';
import { extractErrorMessage } from 'src/app/util/utils';

@Component({
  selector: 'app-machine-form',
  templateUrl: './machine-form.component.html',
  styleUrls: ['./machine-form.component.scss'],
})
export class MachineFormComponent implements OnInit {
  @Input() id: number | undefined;

  // Field baru
  machine_merk: string = "";
  machine_type: string = "";
  function: string = "";
  nim: string = "";
  purchase_date: string = "";
  assignedTailor: string = "";

  // Error
  error_message: string = "";

  // Method status
  method: string = "insert";

  constructor(
    private navController: NavController,
    private dataService: DataService
  ) { }

  ngOnInit() {
    (document.getElementById('loader') as HTMLElement).classList.add('hidden');

    if (!Number.isNaN(this.id)) {
      this.getDetailMachine();
    }
  }

  getDetailMachine() {
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');

    this.dataService.getMachine(Number(this.id)).subscribe((response) => {
      (document.getElementById('loader') as HTMLElement).classList.add('hidden');
      const data = response.data;

      console.log(data)

      this.machine_merk = data.machine_merk;
      this.machine_type = data.machine_type;
      this.function = data.function;
      this.nim = data.nim;

      this.purchase_date = data.purchase_date
        ? new Date(data.purchase_date).toISOString().split("T")[0]
        : "";

      this.assignedTailor = data.user?.name || "";


      this.method = "update";
    });
  }


  backBtn() {
    this.navController.back({ animated: false });
  }

  save() {

    (document.getElementById('progress-save') as Element).classList.remove('hidden');
    (document.getElementById('button-group-save') as Element).classList.add('hidden');

    const data = {
      machine_merk: this.machine_merk,
      machine_type: this.machine_type,
      function: this.function,
      nim: this.nim,
      purchase_date: this.purchase_date + 'T12:00:00'
    };


    if (this.method !== "update") {
      this.insertData(data);
    } else {
      this.updateData(data);
    }
  }

  insertData(data: any) {
    this.dataService.insertMachine(data).subscribe(
      () => this.backBtn(),
      (error) => this.handleError(error)
    );
  }

  updateData(data: any) {
    data.id = this.id;

    this.dataService.updateMachine(data).subscribe(
      () => this.backBtn(),
      (error) => this.handleError(error)
    );
  }

  handleError(error: any) {
    this.error_message = extractErrorMessage(error);

    (document.getElementById('progress-save') as Element).classList.add('hidden');
    (document.getElementById('button-group-save') as Element).classList.remove('hidden');
  }

  allowOnlyDigitsAndDash(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if (!/[0-9\-]/.test(event.key)) {
      event.preventDefault();
    }
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DataService } from 'src/app/service/data.service';
import { extractErrorMessage } from 'src/app/util/utils';
import Swal from 'sweetalert2';

interface CategoryData {
  id?: number;
  category_name: string;
  estimation: number;
  description: string;
  difficulty: string;
  spareparts: { id: number; qty: number; sparepart_name: string }[];
}

interface CategoryDataResponse {
  id?: number;
  category_name: string;
  estimation: number;
  description: string;
  difficulty: string;
  spareparts: { sparepart: { id: number; sparepart_name: string }; qty: number }[];
}

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit {
  @Input() id: number | undefined;

  // Form fields
  category_name: string = '';
  estimation: number = 0;
  description: string = '';
  difficulty: string = '';
  selectedSpareparts: { id: number; sparepart_name: string; qty: number }[] = [];

  sparepartOptions: any[] = [];
  sparepartSearchTerm: string = '';
  filteredSpareparts: any[] = [];
  showDropdown: boolean = false;
  isLoadingSpareparts: boolean = false;
  sparepartTotal: number = 0;

  // Error message
  error_message: string = '';

  // Method type
  method: string = 'insert';

  constructor(
    private navController: NavController,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.hideLoader();
    this.loadSpareparts();
    if (!Number.isNaN(this.id)) {
      this.getDetailCategory();
    }
  }

  private getDetailCategory(): void {
    this.showLoader();

    this.dataService.getCategory(parseInt(this.id + '')).subscribe({
      next: (response) => {
        console.log('Response Category:', response);
        this.hideLoader();
        this.populateForm(response.data);
        this.method = 'update';
      },
      error: (error) => {
        console.error('Error fetching category:', error);
        this.hideLoader();
      },
    });
  }

  private populateForm(data: CategoryDataResponse): void {
    this.category_name = data.category_name;
    this.estimation = data.estimation;
    this.description = data.description;
    this.difficulty = data.difficulty;

    data.spareparts.forEach((item) => {
      this.selectedSpareparts.push({
        sparepart_name: item.sparepart.sparepart_name,
        id: item.sparepart.id,
        qty: item.qty,
      });
    });

    console.log('Spareparts List Selected:');
    console.log(data.spareparts);
  }

  backBtn(): void {
    this.navController.back({ animated: false });
  }

  save(): void {
    this.showSaveProgress();

    const data: CategoryData = {
      category_name: this.category_name,
      estimation: this.estimation,
      description: this.description,
      difficulty: this.difficulty,
      spareparts: this.selectedSpareparts,
    };

    if (this.method === 'insert') {
      this.insertData(data);
    } else {
      this.updateData(data);
    }
  }

  private insertData(data: CategoryData): void {
    this.dataService.insertCategory(data).subscribe({
      next: () => {
        this.backBtn();
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }

  private updateData(data: CategoryData): void {
    const updateData = { ...data, id: this.id };

    this.dataService.updateCategory(updateData).subscribe({
      next: () => {
        this.backBtn();
      },
      error: (error) => {
        this.handleError(error);
      },
    });
  }

  private handleError(error: any): void {
    this.error_message = '';
    if (error.error) {
      this.error_message = extractErrorMessage(error)
    }

    this.hideSaveProgress();
  }

  private showLoader(): void {
    this.toggleElementVisibility('loader', false);
  }

  private hideLoader(): void {
    this.toggleElementVisibility('loader', true);
  }

  private showSaveProgress(): void {
    this.toggleElementVisibility('progress-save', false);
    this.toggleElementVisibility('button-group-save', true);
  }

  private hideSaveProgress(): void {
    this.toggleElementVisibility('progress-save', true);
    this.toggleElementVisibility('button-group-save', false);
  }

  private toggleElementVisibility(elementId: string, hide: boolean): void {
    const element = document.getElementById(elementId);
    if (element) {
      if (hide) {
        element.classList.add('hidden');
      } else {
        element.classList.remove('hidden');
      }
    }
  }

  onSparepartSearch(): void {
    if (this.sparepartSearchTerm.length >= 2) {
      this.loadSpareparts(this.sparepartSearchTerm);
      this.showDropdown = true;
    } else if (this.sparepartSearchTerm.length === 0) {
      this.loadSpareparts();
      this.showDropdown = true;
    } else {
      this.filteredSpareparts = [];
      this.showDropdown = false;
    }
  }

  loadSpareparts(search: string = ''): void {
    const size = 50;
    const page = 1;

    this.dataService.getSpareparts(size, page, search).subscribe((res) => {
      this.sparepartOptions = res.data || [];
      this.sparepartTotal = res.total_items;
      this.filterSpareparts();
    });
  }

  filterSpareparts(): void {
    const selectedIds = this.selectedSpareparts.map((item) => item.id);

    if (this.sparepartSearchTerm.length === 0) {
      this.filteredSpareparts = this.sparepartOptions
        .filter((item) => !selectedIds.includes(item.id))
        .slice(0, 20);
    } else {
      this.filteredSpareparts = this.sparepartOptions.filter(
        (item) =>
          !selectedIds.includes(item.id) &&
          item.sparepart_name
            .toLowerCase()
            .includes(this.sparepartSearchTerm.toLowerCase())
      );
    }
  }

  onSearchFocus(): void {
    if (this.sparepartSearchTerm.length === 0) {
      this.loadSpareparts();
    }
    this.showDropdown = true;
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  selectSparepart(sparepart: any): void {
    this.selectedSpareparts.push({
      id: sparepart.id,
      sparepart_name: sparepart.sparepart_name,
      qty: 1,
    });

    this.sparepartSearchTerm = '';
    this.showDropdown = false;
    this.filteredSpareparts = [];
  }

  updateQuantity(index: number, qty: number): void {
    if (qty > 0) {
      this.selectedSpareparts[index].qty = qty;
    }
  }

  validateQuantityInput(index: number, event: any): void {
    const value = parseInt(event.target.value);

    if (isNaN(value) || value < 1) {
      event.target.value = 1;
      this.selectedSpareparts[index].qty = 1;
    } else {
      this.selectedSpareparts[index].qty = value;
    }
  }

  removeSelectedSparepart(index: number): void {
    this.selectedSpareparts.splice(index, 1);
    this.filterSpareparts();
  }

  getTotalQty(): number {
    if (!this.selectedSpareparts || this.selectedSpareparts.length === 0)
      return 0;

    return this.selectedSpareparts.reduce((sum, item) => sum + (+item.qty || 0), 0);
  }
}

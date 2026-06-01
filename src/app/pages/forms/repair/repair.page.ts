import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { DataService } from 'src/app/service/data.service';
import { extractErrorMessage, getDifficultyIN, getStatusReportIN, isDarkTheme } from 'src/app/util/utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-repair',
  templateUrl: './repair.page.html',
  styleUrls: ['./repair.page.scss'],
})
export class RepairPage implements OnInit {
  id: number = 0;
  categories: Array<any> = [];

  name = "";
  nik = "";
  nim = "";
  title = "";
  description = "";
  notes = "";
  status = "";
  category_id: number | null = null;
  selected_category: any = null;
  start_time = "";
  end_time = "";
  action = "";
  machine_id = 0;
  user_id = 0;
  action_report : any = null;
  error_message = "";
  isTailor = false;

  reportSpareparts: { sparepart_id: number, sparepart_name: string, qty: number, max_stock?: number }[] = [];
  spareparts: { sparepart_id: number | null, qty: number, search: string }[] = [];
  sparepartOptions: any[] = [];
  sparepartSearchTerm = '';
  filteredSpareparts: any[] = [];
  selectedSpareparts: { sparepart_id: number, sparepart_name: string, qty: number, max_stock: number }[] = [];

  showDropdown = false;
  isLoadingSpareparts = false;

  constructor(
    private navController: NavController,
    private activatedRouter: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.id = parseInt(this.activatedRouter.snapshot.paramMap.get('id') + "");
    this.getCategories();
    this.getData();
    this.loadSpareparts();
  }

  backBtn() {
    this.navController.back({ animated: false });
  }

  getCategories() {
    const loader = document.getElementById('loader') as HTMLElement;
    loader?.classList.remove('hidden');

    this.dataService.getCategories(100, 1, "").subscribe((response) => {
      loader?.classList.add('hidden');

      this.categories = (response?.data ?? []).map((c: any) => ({
        ...c,
        id: c?.id != null ? Number(c.id) : c.id,
      }));

      if (this.category_id != null) {
        this.category_id = Number(this.category_id);
      }
    });
  }

  getData() {
    this.dataService.getReport(this.id).subscribe((res) => {
      const data = res.data;
      this.name = data.user.name;
      this.nik = data.user.nik;
      this.nim = data.machine.nim;
      this.title = data.title;
      this.description = data.category?.description ?? "";
      this.category_id = data.category?.id != null ? Number(data.category.id) : null;
      this.notes = data.notes;
      this.status = data.status;
      this.action = data.action_report.action;
      this.action_report = data.action_report;

      this.selectedSpareparts = [];
      this.reportSpareparts = [];

      const hasReportSpareparts =
        Array.isArray(data.action_report?.action_report_spareparts) &&
        data.action_report.action_report_spareparts.length > 0;

      if (hasReportSpareparts && (this.status === 'process' || this.status === 'on_hold' || this.status === 'done')) {
        this.loadReportSpareparts(data.action_report);

        if (this.status === 'process' || this.status === 'on_hold') {
          this.selectedSpareparts = this.reportSpareparts.map((item) => ({
            sparepart_id: item.sparepart_id,
            sparepart_name: item.sparepart_name,
            qty: item.qty,
            max_stock: item.max_stock || 0,
          }));
        }
      } else {
        if (Array.isArray(data.category?.spareparts)) {
          data.category.spareparts.forEach((item: any) => {
            const suggestedQty =
              Number(item.qty ?? item.default_qty ?? item.pivot?.qty ?? 1);
            const maxStock = Number(item.sparepart?.qty ?? 0);

            this.selectedSpareparts.push({
              sparepart_id: item.sparepart_id ?? item.sparepart?.id ?? item.id,
              sparepart_name: item.sparepart?.sparepart_name ?? item.name ?? 'Unknown',
              qty: Math.min(suggestedQty, maxStock || suggestedQty),
              max_stock: maxStock,
            });
          });
        }
      }

      this.start_time = formatDate(data.action_report.start_time, 'EEEE, MMMM d, yyyy, hh:mm a', 'en-US');
      if (data.action_report.end_time)
        this.end_time = formatDate(data.action_report.end_time, 'EEEE, MMMM d, yyyy, hh:mm a', 'en-US');
    });
  }

  loadReportSpareparts(actionReport: any) {
    if (actionReport?.action_report_spareparts?.length) {
      this.reportSpareparts = actionReport.action_report_spareparts.map((item: any) => ({
        sparepart_id: item.sparepart_id,
        sparepart_name: item.sparepart?.sparepart_name || 'Unknown Sparepart',
        qty: Number(item.qty) || 0,
        max_stock: Number(item.sparepart?.qty ?? item.max_stock ?? 0),
      }));

      if (this.status === 'process') {
        this.selectedSpareparts = this.reportSpareparts.map((item) => ({
          sparepart_id: item.sparepart_id,
          sparepart_name: item.sparepart_name,
          qty: item.qty,
          max_stock: item.max_stock || 0,
        }));
      }
    } else {
      this.reportSpareparts = [];
    }
  }

  onCategoryChange() {
    const id = this.category_id != null ? Number(this.category_id) : null;
    this.selected_category = this.categories.find((c) => c.id === id);
    this.description = this.selected_category?.description || "";
  }

  loadSpareparts(search: string = "") {
    this.dataService.getSpareparts(50, 1, search).subscribe((res) => {
      this.sparepartOptions = res.data || [];
      this.filterSpareparts();
    });
  }

  onSparepartSearch() {
    if (this.sparepartSearchTerm.length >= 2 || this.sparepartSearchTerm.length === 0) {
      this.loadSpareparts(this.sparepartSearchTerm);
      this.showDropdown = true;
    } else {
      this.filteredSpareparts = [];
      this.showDropdown = false;
    }
  }

  filterSpareparts() {
    const selectedIds = this.selectedSpareparts.map((item) => item.sparepart_id);

    this.filteredSpareparts = this.sparepartOptions.filter((item) =>
      !selectedIds.includes(item.id) &&
      (this.sparepartSearchTerm === "" || item.sparepart_name.toLowerCase().includes(this.sparepartSearchTerm.toLowerCase()))
    ).slice(0, 20);
  }

  onSearchFocus() {
    if (this.sparepartSearchTerm.length === 0) this.loadSpareparts();
    this.showDropdown = true;
  }

  hideDropdown() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  selectSparepart(sparepart: any) {
    this.selectedSpareparts.push({
      sparepart_id: sparepart.id,
      sparepart_name: sparepart.sparepart_name,
      qty: 1,
      max_stock: sparepart.qty || 0,
    });

    this.sparepartSearchTerm = '';
    this.filteredSpareparts = [];
    this.showDropdown = false;
  }

  removeSelectedSparepart(index: number) {
    this.selectedSpareparts.splice(index, 1);
    this.filterSpareparts();
  }

  updateQuantity(index: number, qty: number) {
    const item = this.selectedSpareparts[index];
    if (qty > item.max_stock) {
      this.showWarning(`Stok tersedia: ${item.max_stock}. Tidak dapat menambahkan lebih dari stok yang tersedia.`);
      this.selectedSpareparts[index].qty = item.max_stock;
    } else if (qty > 0) {
      this.selectedSpareparts[index].qty = qty;
    }
  }

  validateQuantityInput(index: number, event: any) {
    const value = parseInt(event.target.value);
    const item = this.selectedSpareparts[index];

    if (isNaN(value) || value < 1) {
      event.target.value = 1;
      item.qty = 1;
    } else if (value > item.max_stock) {
      event.target.value = item.max_stock;
      item.qty = item.max_stock;
      this.showWarning(`Stok maksimum yang tersedia: ${item.max_stock}`);
    } else {
      item.qty = value;
    }
  }

  getTotalQty(): number {
    const source = this.status === 'done' ? this.reportSpareparts : this.selectedSpareparts;
    return source.reduce((sum, item) => sum + (+item.qty || 0), 0);
  }

  addSparepart() {
    this.spareparts.push({ sparepart_id: null, qty: 1, search: '' });
  }

  removeSparepart(index: number) {
    this.spareparts.splice(index, 1);
  }

  startBtn() {
    const dark = isDarkTheme();
    const isResume = this.status === 'on_hold';

    const selectedCategoryId = this.category_id ? Number(this.category_id) : null;

    Swal.fire({
      title: isResume ? 'Lanjutkan Perbaikan?' : 'Mulai Perbaikan?',
      text: isResume
        ? 'Perbaikan akan dilanjutkan dan waktu kerja akan direkam kembali.'
        : 'Perbaikan akan dimulai dan waktu kerja Anda akan mulai direkam.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isResume ? 'Ya, lanjutkan' : 'Ya, mulai',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',
      buttonsStyling: false,
      customClass: {
        actions: 'mt-4 flex gap-2',
        confirmButton: `${
          dark ? 'bg-primary hover:bg-primary/90 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
        } px-4 py-2 rounded-lg font-medium`,
        cancelButton: `${
          dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
        } px-4 py-2 rounded-lg font-medium`,
        popup: 'rounded-xl shadow-lg'
      }
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.dataService.startRepair(this.id, selectedCategoryId).subscribe({
        next: () => {
          this.getData();
          Swal.fire({
            icon: 'success',
            title: isResume ? 'Dilanjutkan' : 'Dimulai',
            text: isResume
              ? 'Perbaikan berhasil dilanjutkan.'
              : 'Perbaikan berhasil dimulai.',
            background: dark ? '#1e293b' : '#ffffff',
            color: dark ? '#f1f5f9' : '#0f172a'
          });
        },
        error: (error) => {
          console.error(error);
          this.showErrorMessage(extractErrorMessage(error));
        }
      });
    });
  }

  endBtn() {
    const dark = isDarkTheme();

    Swal.fire({
      title: 'Selesaikan Proses Perbaikan?',
      text: 'Apakah Anda yakin ingin menyelesaikan proses perbaikan ini?',
      icon: 'warning',
      iconColor: dark ? '#f59e0b' : '#d97706',
      showCancelButton: true,
      confirmButtonText: 'Ya, selesaikan!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',
      buttonsStyling: false,
      customClass: {
        actions: 'mt-4 flex gap-2',
        confirmButton: `${dark
          ? 'bg-green-500 hover:bg-green-600 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'} px-4 py-2 rounded-lg font-medium`,
        cancelButton: `${dark
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} px-4 py-2 rounded-lg font-medium`,
        popup: 'rounded-xl shadow-lg'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          action: this.action,
          spareparts: this.selectedSpareparts.map(item => ({
            sparepart_id: item.sparepart_id,
            qty: item.qty
          }))
        };

        this.dataService.endRepair(payload, this.id).subscribe({
          next: () => {
            this.getData();
            Swal.fire({
              icon: 'success',
              title: 'Selesai!',
              text: 'Proses perbaikan berhasil diselesaikan.',
              background: dark ? '#1e293b' : '#ffffff',
              color: dark ? '#f1f5f9' : '#0f172a'
            });
          },
          error: (error) => {
            console.error(error);

            let errorMsg = 'Terjadi kesalahan';
            if (error?.error?.errors && typeof error.error.errors === 'object') {
              errorMsg = Object.values(error.error.errors).flat().join('\n');
            } else if (error?.error?.message) {
              errorMsg = error.error.message;
            }

            Swal.fire({
              icon: 'error',
              title: 'Gagal Menyelesaikan',
              text: errorMsg,
              background: dark ? '#1e293b' : '#ffffff',
              color: dark ? '#f1f5f9' : '#0f172a',
              confirmButtonColor: dark ? '#ef4444' : '#d33'
            });
          }
        });
      }
    });
  }

  private showErrorMessage(message: string) {
    const dark = isDarkTheme();

    Swal.fire({
      icon: 'error',
      title: 'Gagal Mulai!',
      text: message,
      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',
      confirmButtonColor: dark ? '#ef4444' : '#d33'
    });
  }

  private showWarning(message: string) {
    const dark = isDarkTheme();

    Swal.fire({
      title: 'Stok Tidak Mencukupi',
      text: message,
      icon: 'warning',
      iconColor: dark ? '#f59e0b' : '#d97706',
      confirmButtonText: 'OK',
      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',
      confirmButtonColor: dark ? '#3b82f6' : '#3085d6'
    });
  }

  getStatusIN(status:string): string{
    return getStatusReportIN(status)
  }

  getDifficultyIN(difficulty:string): string{
    return getDifficultyIN(difficulty)
  }

  compareCat = (a: any, b: any) => String(a) === String(b);

  pauseBtn() {
    const dark = isDarkTheme();

    Swal.fire({
      title: 'Tunda Perbaikan?',
      input: 'text',
      inputLabel: 'Alasan penundaan (opsional)',
      inputPlaceholder: 'Boleh dikosongkan',
      inputAttributes: { maxlength: '200' },
      icon: 'warning',
      iconColor: dark ? '#f59e0b' : '#d97706',
      showCancelButton: true,
      confirmButtonText: 'Ya, tunda',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      background: dark ? '#0f172a' : '#ffffff',
      color: dark ? '#e2e8f0' : '#0f172a',
      buttonsStyling: false,
      customClass: {
        actions: 'mt-4 flex gap-2',
        confirmButton: `${dark
          ? 'bg-warning text-white hover:bg-warning/90'
          : 'bg-amber-500 text-white hover:bg-amber-600'} px-4 py-2 rounded-lg font-medium`,
        cancelButton: `${dark
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} px-4 py-2 rounded-lg font-medium`,
        popup: 'rounded-xl border-0 shadow-none'
      }
    }).then((result) => {
      if (!result.isConfirmed) return;

      const val = (result.value ?? '').toString().trim();
      const reason = val === '' ? null : val; // kosong → null

      this.dataService.pauseRepair(this.id, reason).subscribe({
        next: () => {
          this.status = 'on_hold';
          this.getData();
          Swal.fire({
            icon: 'success',
            title: 'Ditunda',
            text: 'Perbaikan berhasil ditandai on hold.',
            background: dark ? '#0f172a' : '#ffffff',
            color: dark ? '#e2e8f0' : '#0f172a',
            customClass: { popup: 'rounded-xl border-0 shadow-none' }
          });
        },
        error: (err) => {
          const msg = extractErrorMessage(err) || 'Gagal menunda perbaikan.';
          Swal.fire({
            icon: 'error',
            title: 'Gagal Menunda',
            text: msg,
            background: dark ? '#0f172a' : '#ffffff',
            color: dark ? '#e2e8f0' : '#0f172a',
            customClass: { popup: 'rounded-xl border-0 shadow-none' }
          });
        }
      });
    });
  }
}

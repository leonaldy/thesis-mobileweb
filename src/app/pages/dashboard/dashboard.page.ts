import Chart from 'chart.js/auto';
import { formatDate } from '@angular/common';
import { Component, input, OnInit, ViewEncapsulation } from '@angular/core'
import { Subject, debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs';
import { DataService, ExportType } from 'src/app/service/data.service';
import { FcmService } from 'src/app/service/fcm.service';
import { Router } from '@angular/router';
import { getRoleIN, getStatusReportIN, getCategoryName, isDarkTheme, TYPE_LABELS_ID } from 'src/app/util/utils';
import Swal from 'sweetalert2';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { LocalNotifications } from '@capacitor/local-notifications';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  //==============================
  listQueueDamages : any[] = [];
  listTechnicians : any[] = [];
  //Loader
  isLoadingLoad : boolean = false;
  //Role
  roleUser : String = localStorage.getItem("role") + ""

  //==============================
  // For Technician
  listReports:any[]=[];
  //Paginate
  visiblePages:number[]=[];
  selectedPage:number=1;
  totalPages:number=0;
  totalDataReports:number=0;
  //Entry
  firstIndEntry:number=0;
  lastIndEntry:number=0;
  //Search
  searchSubject = new Subject<string>();
  searchQuery: string = '';

  intervalRef: any = null;

  // DUMMY DATA - Current report sedang dikerjakan oleh teknisi
  currentReport: any = null;
  machinesOnHold: any[] = [];

  isBusy: boolean = false;
  isSearchShow = false;

  private _lastExportOk = false;
  private _lastExportName = '';

  constructor(
    private dataService : DataService,
    private router: Router
  ) {
  }

  ngOnInit(){
    this.initYearOptions(10);
  }

  ionViewWillEnter(){
    if (this.roleUser === "foreman") {
      this.router.navigate(['/broken-machine'], { replaceUrl: true });
      return;
    }

    if (this.roleUser === "tailor") {
      this.router.navigate(['/profile'], { replaceUrl: true });
      return;
    }

    // this.fcmService.initPush()
    if(this.roleUser !== "technician"){
      this.getQueueDamage();
      this.getTechnician();
    }else{
      this.getReports();
      this.initTechnician();
      this.getInformationTechnician();

      this.intervalRef = setInterval(() => {
        this.getReports();
      }, 5000);
    }
    if(this.roleUser === "management"){
      this.loadChart()
    }
  }

  selectedYear: number = new Date().getFullYear();
  yearOptions: number[] = [];

  selectedForemanIdFC: number | null = null;
  selectedMonthFC: number = new Date().getMonth() + 1;
  foremanList: any[] = [];
  foremanChart: Chart | null = null;

  selectedMonth = new Date().getMonth() + 1;
  selectedDifficulty = "";
  months = [
    { name: 'Januari', value: 1 },
    { name: 'Februari', value: 2 },
    { name: 'Maret', value: 3 },
    { name: 'April', value: 4 },
    { name: 'Mei', value: 5 },
    { name: 'Juni', value: 6 },
    { name: 'Juli', value: 7 },
    { name: 'Agustus', value: 8 },
    { name: 'September', value: 9 },
    { name: 'Oktober', value: 10 },
    { name: 'November', value: 11 },
    { name: 'Desember', value: 12 },
  ];

  chartSummaryInstance: any = null;


  async getQueueDamage(){
    this.isLoadingLoad = true;
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    this.dataService.getQueueDashboard().subscribe(
      (response)=>{
        this.listQueueDamages = response.data;
        console.log(response);
        (document.getElementById('loader') as HTMLElement).classList.add('hidden');
        this.isLoadingLoad = false;
      },(error)=>{
        console.log(error);
      }
    )
  }

  initYearOptions(back: number = 10): void {
    const now = new Date().getFullYear();
    this.yearOptions = Array.from({ length: back + 1 }, (_, i) => now - i);
  }

  onYearFilterChange(): void {
    this.loadChart()
  }

  onSearch(event: any): void {
    const query = event.target.value;
    this.searchSubject.next(query);
  }

  loadChart(){
    this.totalMachineCrashedPerMonthChart()
    this.machineCrashedPerYearChart()
    this.technicianRepairChart()
    this.userReportChart()
    this.summaryByCategoryChart();
    this.loadForemen();
    this.sparepartTrendTopTypesPerMonthChart();
  }

  loadForemen() {
    this.dataService.getUsers(20,1,'foreman').subscribe((res: any) => {
      this.foremanList = res.data;
      if (this.foremanList.length > 0) {
        this.selectedForemanIdFC = this.foremanList[0].id;
        this.onForemanFilterChange()
      }
    });
  }

  async getTechnician(){
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    this.dataService.getUsers(4,1,"technician").subscribe(
      (response)=>{
        this.listTechnicians = response.data;
        console.log(response);
        (document.getElementById('loader') as HTMLElement).classList.add('hidden');
      },(error)=>{
        console.log(error);
      }
    )
  }

  totalMachineCrashedChartInstance?: Chart;

  totalMachineCrashedPerMonthChart() {
    const canvas  = document.getElementById('totalMachineCrashedChart') as HTMLCanvasElement | null;
    const loading = document.getElementById('totalMachineCrashedChart-loading');
    const empty   = document.getElementById('totalMachineCrashedChart-empty');

    // State awal
    canvas?.classList.add('hidden');
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');

    this.dataService.getTotalMachineCrashedperMonth(this.selectedYear).subscribe(
      (response) => {
        const rows = (response?.data ?? []) as any[];
        const labels = rows.map((r) => String(r.month ?? ''));
        const dataValues = rows.map((r) => Number(r.total) || 0);

        const hasData = rows.length > 0; // ✅ 0 masih dianggap ada data

        // Destroy chart lama
        if (this.totalMachineCrashedChartInstance) {
          this.totalMachineCrashedChartInstance.destroy();
          this.totalMachineCrashedChartInstance = undefined;
        }

        if (!hasData || !canvas) {
          loading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          loading?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        const max = Math.max(...dataValues);
        const min = Math.min(...dataValues);
        const dynamicBackgroundColor = dataValues.map((value) => {
          let intensity = 0.6;
          if (max !== min) intensity = ((value - min) / (max - min)) * 0.8 + 0.2;
          return `rgba(54, 162, 235, ${intensity.toFixed(2)})`;
        });

        this.totalMachineCrashedChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Total Kerusakan Mesin per Bulan',
              data: dataValues,
              backgroundColor: dynamicBackgroundColor,
              borderColor: 'rgba(54, 162, 235, 0.8)',
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
            }],
          },
          options: {
            maintainAspectRatio:false,
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: `Total Kerusakan Mesin (${this.selectedYear})` },
            },
            scales: {
              x: { title: { display: true, text: 'Bulan' } },
              y: { beginAtZero: true, title: { display: true, text: 'Total Kerusakan' } },
            },
          },
        });

        loading?.classList.add('hidden');
        canvas.classList.remove('hidden');
      },
      (error) => {
        console.error(error);
        loading?.classList.add('hidden');
        canvas?.classList.add('hidden');
        empty?.classList.remove('hidden');
      }
    );
  }


  machineCrashedChartInstance?: Chart;

  machineCrashedPerYearChart() {
    const canvas  = document.getElementById('machineCrashedChart') as HTMLCanvasElement | null;
    const loading = document.getElementById('machineCrashedChart-loading');
    const empty   = document.getElementById('machineCrashedChart-empty');

    // State awal
    canvas?.classList.add('hidden');
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');

    this.dataService.getMachineCrashedperYear(this.selectedYear).subscribe(
      (response) => {
        const rows = (response?.data ?? []) as any[];
        const labels = rows.map((item) => String(item.nim ?? ''));
        const dataValues = rows.map((item) => Number(item.total_crashes) || 0);

        const hasData = rows.length > 0 && dataValues.some(v => v > 0);

        if (this.machineCrashedChartInstance) {
          this.machineCrashedChartInstance.destroy();
          this.machineCrashedChartInstance = undefined;
        }

        if (!hasData || !canvas) {
          loading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          loading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        // warna dinamis aman saat max===min
        const max = Math.max(...dataValues);
        const min = Math.min(...dataValues);
        const dynamicBackgroundColor = dataValues.map((value) => {
          let intensity = 0.6; // default kalau semua sama
          if (max !== min) intensity = ((value - min) / (max - min)) * 0.8 + 0.2;
          return `rgba(75, 192, 192, ${intensity.toFixed(2)})`;
        });

        this.machineCrashedChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Total Kerusakan Mesin',
              data: dataValues,
              backgroundColor: dynamicBackgroundColor,
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            }],
          },
          options: {
            maintainAspectRatio:false,
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Total Kerusakan Mesin per NIM' },
            },
            scales: {
              x: { title: { display: true, text: 'NIM' } },
              y: { beginAtZero: true, title: { display: true, text: 'Total Kerusakan' } },
            },
          },
        });

        loading?.classList.add('hidden');
        canvas.classList.remove('hidden');
      },
      (error) => {
        console.error(error);
        loading?.classList.add('hidden');
        canvas?.classList.add('hidden');
        empty?.classList.remove('hidden');
      }
    );
  }

  technicianRepairChartInstance?: Chart;

  technicianRepairChart() {
    const canvas = document.getElementById('technicianRepairChart') as HTMLCanvasElement | null;
    const loading = document.getElementById('technicianRepairChart-loading');
    const empty   = document.getElementById('technicianRepairChart-empty');

    canvas?.classList.add('hidden');
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');

    this.dataService.getTechnicianRepairperYear(this.selectedYear).subscribe(
      (response) => {
        const rows = (response?.data ?? []) as any[];
        const labels = rows.map(r => String(r.name ?? ''));
        const dataValues = rows.map(r => Number(r.total_repairs) || 0);

        const hasData = rows.length > 0 && dataValues.some(v => v > 0);

        if (this.technicianRepairChartInstance) {
          this.technicianRepairChartInstance.destroy();
          this.technicianRepairChartInstance = undefined;
        }

        if (!hasData || !canvas) {
          loading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          loading?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        const max = Math.max(...dataValues);
        const min = Math.min(...dataValues);
        const dynamicBackgroundColor = dataValues.map(value => {
          let intensity = 0.6;
          if (max !== min) intensity = ((value - min) / (max - min)) * 0.8 + 0.2;
          return `rgba(54, 162, 235, ${intensity.toFixed(2)})`;
        });

        this.technicianRepairChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Total Perbaikan',
              data: dataValues,
              backgroundColor: dynamicBackgroundColor,
              borderColor: 'rgba(54, 162, 235, 0.8)',
              borderWidth: 1,
            }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Total Perbaikan per Teknisi' },
              tooltip: {
                callbacks: {
                  label: (t: any) => `Total Perbaikan: ${t.raw}`,
                },
              },
            },
            scales: {
              x: { beginAtZero: true, title: { display: true, text: 'Total Perbaikan' } },
              y: { title: { display: true, text: 'Nama Teknisi' } },
            },
          },
        });

        loading?.classList.add('hidden');
        canvas.classList.remove('hidden');
      },
      (error) => {
        console.error(error);
        loading?.classList.add('hidden');
        canvas?.classList.add('hidden');
        empty?.classList.remove('hidden');
      }
    );
  }

  userReportChartInstance?: Chart;

  userReportChart() {
    const canvas = document.getElementById('userReportChart') as HTMLCanvasElement | null;
    const loading = document.getElementById('userReportChart-loading');
    const empty = document.getElementById('userReportChart-empty');

    canvas?.classList.add('hidden');
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');

    this.dataService.getUserReportperYear(this.selectedYear).subscribe(
      (response) => {
        const rows = (response?.data ?? []) as any[];

        const labels = rows.map((item) => String(item.name ?? ''));
        const dataValues = rows.map((item) => Number(item.total_reports) || 0);

        const hasData = rows.length > 0 && dataValues.some(v => v > 0);

        if (this.userReportChartInstance) {
          this.userReportChartInstance.destroy();
          this.userReportChartInstance = undefined;
        }

        if (!hasData || !canvas) {
          loading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          loading?.classList.add('hidden');
          return;
        }

        const max = Math.max(...dataValues);
        const min = Math.min(...dataValues);
        const dynamicBackgroundColor = dataValues.map((value) => {
          let intensity = 0.6;
          if (max !== min) {
            intensity = ((value - min) / (max - min)) * 0.8 + 0.2;
          }
          return `rgba(54, 162, 235, ${intensity.toFixed(2)})`;
        });

        this.userReportChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Total Laporan',
              data: dataValues,
              backgroundColor: dynamicBackgroundColor,
              borderColor: 'rgba(54, 162, 235, 0.8)',
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                callbacks: {
                  label: (tooltipItem: any) => `Total Laporan: ${tooltipItem.raw}`,
                },
              },
              title: { display: true, text: 'Total Laporan per Pengguna' },
            },
            scales: {
              x: { title: { display: true, text: 'Pengguna' } },
              y: { beginAtZero: true, title: { display: true, text: 'Total Laporan' } },
            },
          },
        });

        loading?.classList.add('hidden');
        canvas.classList.remove('hidden');
      },
      (error) => {
        console.error(error);
        loading?.classList.add('hidden');
        canvas?.classList.add('hidden');
        empty?.classList.remove('hidden');
      }
    );
  }

  // Technician Dashboard Report
  initTechnician(){
    (document.getElementById('loader') as HTMLElement).classList.remove('hidden');
    var page = 1;
    if(localStorage.getItem('save_page')){
      page = parseInt(localStorage.getItem('save_page')+"");
      console.log(page);
      localStorage.removeItem('save_page')
    }
    this.setPage(page);

    this.searchSubject.pipe(
      debounceTime(2000),
      distinctUntilChanged()
    ).subscribe((query: string) => {
      this.searchQuery = query;
      this.selectedPage = 1;
      this.getReports();
    });
  }

  onForemanFilterChange(): void {
    if (!this.selectedForemanIdFC) return;

    const month = this.selectedMonthFC;

    const elemenLoading = document.getElementById('foremanCategoryChart-loading');
    const elemenKanvas = document.getElementById('foremanCategoryChart') as HTMLCanvasElement | null;
    const elemenKosong = document.getElementById('foremanCategoryChart-empty');

    if (elemenLoading) elemenLoading.classList.remove('hidden');
    if (elemenKanvas) elemenKanvas.classList.add('hidden');
    if (elemenKosong) elemenKosong.classList.add('hidden');

    this.dataService.getReportByForemanCategory(this.selectedForemanIdFC, this.selectedYear, month).subscribe(
      (response) => {
        const raw = response?.data ?? {};
        const dataDiagram = [raw.easy, raw.medium, raw.hard, raw.none].map((v: any) => Number(v) || 0);
        const labelDiagram = ['Mudah', 'Sedang', 'Sulit', 'Tidak Ada'];
        const warnaDiagram = ['#369057ff', '#cfa501ff', '#be4b4bff', '#94a3b8'];

        // Hancurkan diagram sebelumnya jika sudah ada
        if (this.foremanChart) {
          this.foremanChart.destroy();
          this.foremanChart = undefined as any;
        }

        const hasData = dataDiagram.some(v => v > 0);

        if (!hasData) {
          if (elemenLoading) elemenLoading.classList.add('hidden');
          if (elemenKanvas) elemenKanvas.classList.add('hidden');
          if (elemenKosong) elemenKosong.classList.remove('hidden');
          return;
        }

        const ctx = elemenKanvas?.getContext('2d');
        if (ctx) {
          this.foremanChart = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: labelDiagram,
              datasets: [{
                data: dataDiagram,
                backgroundColor: warnaDiagram,
                borderWidth: 1
              }]
            },
            options: {
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: {
                  display: true,
                  text: 'Jumlah Mesin Rusak Berdasarkan Tingkat Kesulitan'
                }
              }
            }
          });

          if (elemenLoading) elemenLoading.classList.add('hidden');
          elemenKanvas?.classList.remove('hidden');
          if (elemenKosong) elemenKosong.classList.add('hidden');
        } else {
          if (elemenLoading) elemenLoading.classList.add('hidden');
        }
      },
      (error) => {
        console.error('Gagal mengambil data diagram', error);
        if (elemenLoading) elemenLoading.classList.add('hidden');
        if (elemenKanvas) elemenKanvas.classList.add('hidden');
        if (elemenKosong) elemenKosong.classList.remove('hidden');
      }
    );
  }

  summaryByCategoryChart() {
    const canvas = document.getElementById('summaryByCategoryChart') as HTMLCanvasElement | null;
    const ctx = canvas?.getContext('2d');

    const elemenLoading = document.getElementById('summaryByCategoryChart-loading');
    const elemenKosong = document.getElementById('summaryByCategoryChart-empty');

    if (!ctx) return;

    // State awal
    canvas?.classList.add('hidden');
    elemenLoading?.classList.remove('hidden');
    elemenKosong?.classList.add('hidden');

    this.dataService.getSummarybyCategory(this.selectedYear, this.selectedMonth, this.selectedDifficulty)
      .subscribe((data: any[]) => {
        const labels = data.map(item => getCategoryName(item.category_name));
        const createdToStart = data.map(item => item.avg_created_to_start || 0);
        const startToEnd = data.map(item => item.avg_start_to_end || 0);

        const hasData = data.length > 0 && (
          createdToStart.some(v => v > 0) || startToEnd.some(v => v > 0)
        );

        // Hancurkan chart sebelumnya
        if (this.chartSummaryInstance) {
          this.chartSummaryInstance.destroy();
          this.chartSummaryInstance = undefined as any;
        }

        if (!hasData) {
          // Tidak ada data sama sekali
          elemenLoading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          elemenKosong?.classList.remove('hidden');
          return;
        }

        // Render chart jika ada data
        this.chartSummaryInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Dilaporkan → Diambil',
                data: createdToStart,
                backgroundColor: 'rgba(54, 162, 235, 0.7)'
              },
              {
                label: 'Diambil → Selesai',
                data: startToEnd,
                backgroundColor: 'rgba(255, 99, 132, 0.7)'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio:false,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const value = Number(context.raw ?? 0);
                    const totalMinutes = Math.floor(value / 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${context.dataset.label}: ${hours}j ${minutes}m`;
                  }
                }
              },
              title: {
                display: true,
                text: 'Durasi Rata-rata per Kategori'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value) {
                    const minutes = Math.round(Number(value) / 60);
                    return minutes.toLocaleString() + 'm';
                  }
                },
                title: { display: true, text: 'Durasi (menit)' }
              },
              x: {
                title: { display: true, text: 'Kategori' }
              }
            }
          }
        });

        // Sembunyikan loading, tampilkan chart
        elemenLoading?.classList.add('hidden');
        canvas?.classList.remove('hidden');
      },
      (error) => {
        console.error('Gagal mengambil data summaryByCategory', error);
        elemenLoading?.classList.add('hidden');
        canvas?.classList.add('hidden');
        elemenKosong?.classList.remove('hidden');
      });
  }

  sparepartTrendChartInstance?: Chart;

  sparepartTrendTopTypesPerMonthChart() {
    const canvas  = document.getElementById('sparepartTrendChart') as HTMLCanvasElement | null;
    const loading = document.getElementById('sparepartTrendChart-loading');
    const empty   = document.getElementById('sparepartTrendChart-empty');

    // State awal
    canvas?.classList.add('hidden');
    loading?.classList.remove('hidden');
    empty?.classList.add('hidden');

    this.dataService.getSparepartTrendperMonth(this.selectedYear).subscribe(
      (res) => {
        const chart = res?.chart ?? {};
        const labels: string[] = Array.isArray(chart.categories) ? chart.categories : [];
        const series: Array<{ name: string; data: number[] }> = Array.isArray(chart.series) ? chart.series : [];

        // Build datasets (auto color HSL)
        const color = (i: number) => `hsl(${(i * 360) / Math.max(series.length, 1)}, 70%, 45%)`;
        const datasets = series.map((s, i) => ({
          label: s?.name ?? `Jenis ${i + 1}`,
          data: (s?.data ?? []).map(v => Number(v) || 0),
          borderColor: color(i),
          backgroundColor: color(i),
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          fill: false,
          spanGaps: true,
        }));

        const hasData =
          labels.length > 0 &&
          datasets.length > 0 &&
          datasets.some(ds => ds.data.some(v => v > 0));

        // destroy chart lama
        if (this.sparepartTrendChartInstance) {
          this.sparepartTrendChartInstance.destroy();
          this.sparepartTrendChartInstance = undefined;
        }

        if (!hasData || !canvas) {
          loading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          loading?.classList.add('hidden');
          canvas?.classList.add('hidden');
          empty?.classList.remove('hidden');
          return;
        }

        this.sparepartTrendChartInstance = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            plugins: {
              legend: { position: 'top' },
              title: {
                display: true,
                text: `Trend Bulanan — Top Jenis Suku Cadang (${res?.year ?? this.selectedYear})`,
              },
              tooltip: { mode: 'index', intersect: false },
            },
            scales: {
              x: { title: { display: true, text: 'Bulan' } },
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Jumlah Diganti' },
                ticks: { precision: 0 },
              },
            },
          },
        });

        loading?.classList.add('hidden');
        canvas.classList.remove('hidden');
      },
      (err) => {
        console.error(err);
        loading?.classList.add('hidden');
        canvas?.classList.add('hidden');
        empty?.classList.remove('hidden');
      }
    );
  }

  onFilterChange() {
    this.summaryByCategoryChart();
  }

  getInformationTechnician() {
    this.isBusy = false;
    this.currentReport = null;
    this.machinesOnHold = [];

    this.dataService.getTechnicianInformation().subscribe({
      next: (response: any) => {
        const data = response?.data ?? {};

        this.machinesOnHold = Array.isArray(data?.machines_on_hold)
          ? data.machines_on_hold
          : [];

        const ar = data?.machine_in_progress;
        const r = ar?.report;

        if (r) {
          this.currentReport = {
            id: r?.id ?? 0,
            title: r?.title ?? '-',
            description: r?.notes ?? 'Tidak ada deskripsi.',
            machine: {
              nim: r?.machine?.nim ?? 'Mesin tidak diketahui',
            },
            user: {
              username: r?.user?.username ?? 'Pelapor tidak diketahui',
              name: r?.user?.name ?? 'Pelapor tidak diketahui',
            },
            created_at: r?.created_at ?? null,
            is_priority: !!r?.is_priority,
          };
          this.isBusy = true;
        } else {
          this.currentReport = null;
          this.isBusy = false;
        }
      },
      error: (error) => {
        console.error('Gagal mengambil informasi teknisi:', error);
        this.currentReport = null;
        this.machinesOnHold = [];
        this.isBusy = false;
      },
    });
  }

  getReports(){
    // this.isLoadingLoad = true;
    var getReports;
    if(this.roleUser === "technician")
      getReports = this.dataService.getReports(10,this.selectedPage,this.searchQuery,"request")
    else
      getReports = this.dataService.getReports(10,this.selectedPage,this.searchQuery)
    getReports.subscribe(
      (response)=>{
        console.log(response);
        this.listReports = response.data;
        this.totalPages = response.total_page;
        this.selectedPage = parseInt(response.page);
        this.totalDataReports = response.total_items;
        if(this.listReports.length > 0){
          this.firstIndEntry = response.page * 10 - 9;
          this.lastIndEntry = this.firstIndEntry + this.listReports.length - 1;
        }else{
          this.firstIndEntry = 0;
          this.lastIndEntry = 0;
        }
        this.updatePaginate();
        (document.getElementById('loader') as HTMLElement).classList.add('hidden');
        // this.isLoadingLoad = false;
      }
    )
  }

  updatePaginate(){
    const maxVisiblePages = 5;
    let startPage: number;
    let endPage: number;

    if (this.totalPages <= maxVisiblePages) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      if (this.selectedPage <= Math.floor(maxVisiblePages / 2)) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (this.selectedPage + Math.floor(maxVisiblePages / 2) >= this.totalPages) {
        startPage = this.totalPages - maxVisiblePages + 1;
        endPage = this.totalPages;
      } else {
        startPage = this.selectedPage - Math.floor(maxVisiblePages / 2);
        endPage = this.selectedPage + Math.floor(maxVisiblePages / 2);
      }
    }

    this.visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    console.log(this.visiblePages);
  }

  setPage(page:number){
    if(page == 0)
      return
    if(page > this.totalPages)
      return;
    if(this.selectedPage !== page){
      this.selectedPage = page;
      this.getReports();
    }
  }

  //Util
  formatDate(inputDate: string): string {
    return formatDate(inputDate,'dd-MM-yyyy','en-US')
  }
  formatNumberWa(number: string): string {
    const clean = number.replace(/\D/g, "");

    if (clean.startsWith("62")) {
      return clean;
    }

    if (clean.startsWith("0")) {
      return "62" + clean.substring(1);
    }

    if (clean.startsWith("8")) {
      return "62" + clean;
    }

    return clean;
  }

  limit_length(message:string,length:number):string{
    var value =message.substring(0,length)
    if(message.length > length){
      value += "...";
    }
    return value;
  }
  formatTime(inputDate: string): string {
    return formatDate(inputDate,'hh:mm','en-US')
  }

  ionViewWillLeave() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }
  ngOnDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  async exportChart(type: ExportType) {
    if (type === 'machines_damage_per_month') {
      const nowYear = new Date().getFullYear();
      const baseYear = Number(this.selectedYear) || nowYear;

      const years: number[] = [];
      for (let y = baseYear - 3; y <= baseYear + 3; y++) years.push(y);

      const dark = isDarkTheme();

      this._lastExportOk = false;
      this._lastExportName = '';

      const result = await Swal.fire({
        title: 'Export Excel (Per Tahun)',
        html: `
          <div class="text-left">
            <label class="block text-xs mb-1 ${dark ? 'text-slate-300' : 'text-slate-500'}">Pilih Tahun</label>
            <select id="swal-year"
                    class="w-full h-10 rounded-lg border ${dark ? 'border-navy-600 bg-navy-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 text-sm">
              ${years.map(y => `<option value="${y}" ${y === baseYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonText: 'Batal',
        background: dark ? '#1e293b' : '#ffffff',
        color: dark ? '#f1f5f9' : '#0f172a',
        confirmButtonText: 'Simpan XLSX',
        showLoaderOnConfirm: true,
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
          actions: 'mt-4 flex gap-2',
          confirmButton: `${dark ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'} px-4 py-2 rounded-lg font-medium`,
          cancelButton: `${dark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'} px-4 py-2 rounded-lg font-medium`,
          popup: 'rounded-xl shadow-lg'
        },
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async (): Promise<boolean> => {
          const yearStr = (document.getElementById('swal-year') as HTMLSelectElement)?.value;
          const year = Number(yearStr) || baseYear;

          try {
            const res = await lastValueFrom(this.dataService.exportReportsByYear(type, year));
            const blob = res.body!;
            const label = TYPE_LABELS_ID[type] ?? type;
            const fallback = `${label}__tahun_${year}.xlsx`;
            const filename = this.dataService.extractFilename(res, fallback);

            if (Capacitor.getPlatform() === 'android') {
              await this.saveBlobToGlobalDownload(blob, filename);
            } else if ('showSaveFilePicker' in window) {
              await this.saveViaFilePicker(blob, filename);
            } else {
              this.saveViaBrowser(blob, filename);
            }

            this._lastExportOk = true;
            this._lastExportName = filename;
            return true;
          } catch (e: any) {
            const msg = e?.message || e?.error?.message || 'Gagal mengunduh file.';
            Swal.showValidationMessage(msg);
            return false;
          }
        }
      });

      if (result.isConfirmed && this._lastExportOk) {
        await themedSwal().fire({
          icon: 'success',
          title: 'Tersimpan',
          text: `File berhasil disimpan: ${this._lastExportName}`,
          confirmButtonText: 'OK'
        });
      }
      return;
    }

    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const defFrom = iso(first);
    const defTo = iso(today);
    const dark = isDarkTheme();

    this._lastExportOk = false;
    this._lastExportName = '';

    const result = await Swal.fire({
      title: 'Export Excel',
      html: `
        <div class="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div>
            <label class="block text-xs mb-1 ${dark ? 'text-slate-300' : 'text-slate-500'}">Dari</label>
            <input type="date" id="swal-from"
                  class="w-full h-10 rounded-lg border ${dark ? 'border-navy-600 bg-navy-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 text-sm"
                  value="${defFrom}">
          </div>
          <div>
            <label class="block text-xs mb-1 ${dark ? 'text-slate-300' : 'text-slate-500'}">Sampai</label>
            <input type="date" id="swal-to"
                  class="w-full h-10 rounded-lg border ${dark ? 'border-navy-600 bg-navy-700 text-white' : 'border-slate-300 bg-white text-slate-900'} px-3 text-sm"
                  value="${defTo}">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: 'Batal',
      background: dark ? '#1e293b' : '#ffffff',
      color: dark ? '#f1f5f9' : '#0f172a',
      confirmButtonText: 'Simpan XLSX',
      showLoaderOnConfirm: true,
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        actions: 'mt-4 flex gap-2',
        confirmButton: `${dark ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'} px-4 py-2 rounded-lg font-medium`,
        cancelButton: `${dark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'} px-4 py-2 rounded-lg font-medium`,
        popup: 'rounded-xl shadow-lg'
      },
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async (): Promise<boolean> => {
        const from = (document.getElementById('swal-from') as HTMLInputElement)?.value;
        const to = (document.getElementById('swal-to') as HTMLInputElement)?.value;

        if (!from || !to) {
          Swal.showValidationMessage('Lengkapi kedua tanggal.');
          return false;
        }
        if (new Date(from) > new Date(to)) {
          Swal.showValidationMessage('Tanggal "Dari" tidak boleh melebihi "Sampai".');
          return false;
        }

        try {
          const res = await lastValueFrom(this.dataService.exportReports(type, from, to));
          const blob = res.body!;
          const label = TYPE_LABELS_ID[type] ?? type;
          const fallback = `${label}__${from}_sampai_${to}.xlsx`;
          const filename = this.dataService.extractFilename(res, fallback);

          await this.saveBlobToGlobalDownload(blob, filename);
          this._lastExportOk = true;
          this._lastExportName = filename;
          return true;
        } catch (e: any) {
          const msg = e?.message || e?.error?.message || 'Gagal mengunduh file.';
          Swal.showValidationMessage(msg);
          return false;
        }
      }
    });

    if (result.isConfirmed && this._lastExportOk) {
      await themedSwal().fire({
        icon: 'success',
        title: 'Tersimpan',
        text: `File berhasil disimpan: ${this._lastExportName}`,
        confirmButtonText: 'OK'
      });
    }
  }


  getRoleIN(role:string):string{
    return getRoleIN(role)
  }
  getStatusIN(status:string):string{
    return getStatusReportIN(status)
  }

  // ---- DOWNLOAD HELPERS (ANDROID) ----
  private async saveBlobToGlobalDownload(blob: Blob, filename: string): Promise<{ uri?: string; path: string; directory: Directory; }> {
    const safe = (filename || 'export.xlsx').replace(/[\\/:*?"<>|]+/g, '_');

    if (Capacitor.getPlatform() === 'android') {
      const base64 = await this.blobToBase64(blob);
      const path = `Download/${safe}`;
      const directory = Directory.ExternalStorage;

      const { uri } = await Filesystem.writeFile({
        path,
        data: base64,
        directory,
        recursive: true,
      });

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 2147483647,
          title: 'Ekspor selesai',
          body: `${safe} disimpan ke folder Download`,
          extra: { path, directory }
        }]
      });

      return { uri, path, directory };
    } else {
      if ('showSaveFilePicker' in window) {
        await this.saveViaFilePicker(blob, safe);
      } else {
        this.saveViaBrowser(blob, safe);
      }
      return { path: safe, directory: Directory.Documents };
    }
  }

  private blobToBase64(b: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = String(r.result || '');
        resolve(s.includes(',') ? s.split(',')[1] : s);
      };
      r.onerror = reject;
      r.readAsDataURL(b);
    });
  }

  private async saveViaFilePicker(blob: Blob, filename: string): Promise<void> {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  private saveViaBrowser(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

function themedSwal() {
  const dark = isDarkTheme();
  return Swal.mixin({
    background: dark ? '#1e293b' : '#ffffff',
    color: dark ? '#f1f5f9' : '#0f172a',
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-xl shadow-lg',
      confirmButton: dark
        ? 'bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg font-medium'
        : 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium',
      cancelButton: dark
        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium'
        : 'bg-slate-200 text-slate-900 hover:bg-slate-300 px-4 py-2 rounded-lg font-medium',
      actions: 'mt-4 flex gap-2',
    },
  });
}

import { Observable } from 'rxjs';

export const TYPE_LABELS_ID: Record<string, string> = {
  machines_damage:           'kerusakan_per_mesin',
  spareparts_per_machine:    'suku_cadang_terpakai_per_mesin',
  repairs_per_technician:    'perbaikan_per_teknisi',
  damages_per_tailor:        'kerusakan_per_penjahit',
  durations_per_category:    'durasi_pelaporan_dan_perbaikan_per_kategori',
  machines_damage_per_month: 'kerusakan_per_bulan',
};

export function limit_length(message:string,length:number):string{
  var value =message.substring(0,length)
  if(message.length > length){
    value += "...";
  }
  return value;
}

export function isDarkTheme(): boolean {
  // 1) Class-based (Tailwind 'class' mode)
  if (document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark')) return true;

  // 2) Attribute-based (mis. data-theme="dark")
  const themeAttr = document.documentElement.getAttribute('data-theme') ||
                    document.body.getAttribute('data-theme');
  if (themeAttr && /dark/i.test(themeAttr)) return true;

  // 3) OS-based (Tailwind 'media' mode / macOS)
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}


export function extractErrorMessage(error: any): string {
  if (!error || !error.error) {
    return 'Terjadi kesalahan tidak diketahui.';
  }

  if (error.error.errors && typeof error.error.errors === 'object') {
    const errors = error.error.errors;
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey].length > 0) {
      return errors[firstKey][0];
    }
  }

  if (error.error.message) {
    return error.error.message;
  }

  return 'Terjadi kesalahan. Silakan coba lagi.';
}


export function getStatusMachineIN(status: string): string {
  if (!status) return 'Status Tidak Dikenal';
  switch (status.toLowerCase()) {
    case 'repair requested':
      return 'Permintaan Perbaikan';
    case 'available':
      return 'Tersedia';
    case 'under repair':
      return 'Sedang Diperbaiki';
    case 'on hold':
      return 'Ditunda';
    default:
      return 'Status Tidak Dikenal';
  }
}

export function getStatusReportIN(status: string): string {
  if (!status) return 'Status Tidak Dikenal';
  switch (status.toLowerCase()) {
    case 'request':
      return 'Menunggu';
    case 'process':
      return 'Sedang Diproses';
    case 'done':
      return 'Selesai';
    case 'on_hold':
      return 'Ditunda';
    default:
      return 'Status Tidak Dikenal';
  }
}

export function getDifficultyIN(difficulty: string): string {
  if (!difficulty) return 'Tingkat Kesulitan Tidak Dikenal';
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'Mudah';
    case 'medium':
      return 'Sedang';
    case 'hard':
      return 'Sulit';
    default:
      return 'Tingkat Kesulitan Tidak Dikenal';
  }
}

export function getRoleIN(role: string): string {
  if (!role) return 'Peran tidak dikenal';
  switch (role.toLowerCase()) {
    case 'management':
      return 'Manajemen';
    case 'tailor':
      return 'Penjahit';
    case 'foreman':
      return 'Mandor';
    case 'technician':
      return 'Teknisi';
    default:
      return 'Peran tidak dikenal';
  }
}

export function getStatusUserIN(status: string): string {
  if (!status) return 'Status tidak dikenal';
  switch (status.toLowerCase()) {
    case 'running':
      return 'Aktif';
    case 'not running':
      return 'Nonaktif';
    default:
      return 'Status tidak dikenal';
  }
}

export function getPageIN(page: string): string {
  if (!page) return 'Page tidak dikenal';
  switch (page.toLowerCase()) {
    case 'dashboard':
      return 'Beranda';
    case 'machine':
      return 'Mesin';
    case 'user':
      return 'Pengguna';
    case 'sparepart':
      return 'Suku Cadang';
    case 'report':
      return 'Laporan';
    case 'category':
      return 'Kategori';
    case 'profile':
      return 'Profil';
    case 'broken machine':
      return 'Beranda Mandor';
    default:
      return 'Status tidak dikenal';
  }
}

export function getProfileImage(role: string | null): string {
  switch (role) {
    case 'tailor':
      return 'assets/images/pp_tailor.jpg';
    case 'foreman':
      return 'assets/images/pp_foreman.jpg';
    case 'technician':
      return 'assets/images/pp_technician.jpg';
    case 'management':
      return 'assets/images/pp_management.jpg';
    default:
      return 'assets/images/default_avatar.jpg';
  }
}

export function getCategoryName(category: string | null): string {
  switch (category) {
    case 'Uncategorized':
      return 'Tanpa Kategori';
    default:
      return category || 'Tidak Diketahui';
  }
}

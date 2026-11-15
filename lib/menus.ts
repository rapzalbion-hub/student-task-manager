export type Role = "admin" | "dosen" | "mahasiswa";
export const MENUS: Record<Role, { label: string; href: string; icon: string }[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
    { label: "Dosen", href: "/admin/dosen", icon: "person_pin" },
    { label: "Mahasiswa", href: "/admin/mahasiswa", icon: "groups" },
    { label: "Mata Kuliah", href: "/admin/mata-kuliah", icon: "menu_book" },
    { label: "Tugas", href: "/admin/tugas", icon: "assignment" },
    { label: "Profile", href: "/admin/profile", icon: "account_circle" },
  ],
  dosen: [
    { label: "Dashboard", href: "/dosen/dashboard", icon: "dashboard" },
    { label: "Tugas", href: "/dosen/tugas", icon: "assignment" },
    { label: "Pengumpulan", href: "/dosen/pengumpulan", icon: "inbox" },
    { label: "Mahasiswa", href: "/dosen/mahasiswa", icon: "groups" },
    { label: "Calendar", href: "/dosen/calendar", icon: "calendar_month" },
    { label: "Profile", href: "/dosen/profile", icon: "account_circle" },
  ],
  mahasiswa: [
    { label: "Dashboard", href: "/mahasiswa/dashboard", icon: "dashboard" },
    { label: "Tugas Saya", href: "/mahasiswa/tugas-saya", icon: "task_alt" },
    { label: "Ambil Tugas", href: "/mahasiswa/ambil-tugas", icon: "add_task" },
    { label: "Calendar", href: "/mahasiswa/calendar", icon: "calendar_month" },
    { label: "Profile", href: "/mahasiswa/profile", icon: "account_circle" },
  ],
};
export const SEARCH_PLACEHOLDER: Record<Role, string> = {
  admin: "Cari dosen, mahasiswa, mata kuliah",
  dosen: "Cari tugas, mahasiswa, pengumpulan",
  mahasiswa: "Cari tugas",
};

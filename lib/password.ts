/** Password awal mahasiswa = tanggal lahir (DDMMYYYY) + 2 digit terakhir NIM. Contoh: 2004-01-15 & NIM 230123001 -> "1501200401" */
export function studentPassword(birthDate: string, nim: string) {
  const [y, m, d] = birthDate.split("-");
  return `${d}${m}${y}${nim.slice(-2)}`;
}

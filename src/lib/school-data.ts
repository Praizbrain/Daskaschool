export const SCHOOL = {
  name: "Divine Sources Praiseland High School",
  app: "DaskaSchool",
  subtitle: "Run the whole school from one place.",
  session: "2025 / 2026",
  term: "Second Term",
  address: "14 Praiseland Close, Ikorodu Road, Lagos",
  phone: "+234 803 445 1290",
};

export const CURRENT_USER = {
  name: "Mrs. Grace Adeyemi",
  role: "Super Admin",
  email: "grace@divinesources.ng",
  initials: "GA",
};

export function naira(value: number, opts: { compact?: boolean } = {}) {
  if (opts.compact) {
    if (Math.abs(value) >= 1_000_000)
      return `₦${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
    if (Math.abs(value) >= 1_000) return `₦${Math.round(value / 1_000)}k`;
  }
  return `₦${value.toLocaleString("en-NG")}`;
}

export function pct(collected: number, expected: number) {
  if (!expected) return 0;
  return Math.round((collected / expected) * 100);
}

/* ----------------------------- Finance summary ---------------------------- */

export const FINANCE = {
  expectedRevenue: 48_650_000,
  collectedRevenue: 33_420_000,
  outstandingRevenue: 15_230_000,
  totalExpenses: 19_180_000,
  salaries: 12_400_000,
  todayRevenue: 685_000,
  todayExpenses: 142_500,
  studentCount: 412,
  avgFee: 118_000,
  discounts: 1_640_000,
  extraCharges: 2_680_000,
};

export const ESTIMATED_PROFIT = FINANCE.collectedRevenue - FINANCE.totalExpenses;

export type Section = "KG" | "Primary" | "JSS" | "SS";

export const SECTIONS: {
  name: Section;
  students: number;
  expected: number;
  collected: number;
}[] = [
  { name: "KG", students: 68, expected: 5_440_000, collected: 4_310_000 },
  { name: "Primary", students: 154, expected: 15_400_000, collected: 11_620_000 },
  { name: "JSS", students: 112, expected: 14_560_000, collected: 9_940_000 },
  { name: "SS", students: 78, expected: 13_250_000, collected: 7_550_000 },
];

export const REVENUE_TREND = [
  { month: "Sep", revenue: 6_100_000, expenses: 3_150_000 },
  { month: "Oct", revenue: 5_420_000, expenses: 2_880_000 },
  { month: "Nov", revenue: 4_760_000, expenses: 3_020_000 },
  { month: "Dec", revenue: 3_980_000, expenses: 2_640_000 },
  { month: "Jan", revenue: 7_240_000, expenses: 3_410_000 },
  { month: "Feb", revenue: 5_920_000, expenses: 4_080_000 },
];

export const REVENUE_MIX = [
  { name: "School Fees", value: 26_150_000 },
  { name: "Books", value: 3_420_000 },
  { name: "Uniforms", value: 2_180_000 },
  { name: "Sneakers", value: 980_000 },
  { name: "Exam & Lesson", value: 690_000 },
];

/* -------------------------------- Students -------------------------------- */

export type Student = {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  section: Section;
  guardian: string;
  guardianPhone: string;
  guardianEmail: string;
  gender: "Male" | "Female";
  dob: string;
  address: string;
  fee: number;
  discount: number;
  paid: number;
  status: "Paid" | "Part Payment" | "Owing";
  joined: string;
};

const raw: Array<
  [string, string, string, Section, string, string, "Male" | "Female", number, number, number]
> = [
  ["Chiamaka Okonkwo", "DSP/2023/041", "JSS 2A", "JSS", "Mr. Emeka Okonkwo", "+234 803 221 4410", "Female", 132_000, 0, 132_000],
  ["Tobiloba Adeniran", "DSP/2022/018", "SS 1B", "SS", "Mrs. Funmi Adeniran", "+234 805 774 1122", "Male", 168_000, 12_000, 96_000],
  ["Zainab Bello", "DSP/2024/112", "Primary 4", "Primary", "Alhaji Musa Bello", "+234 802 990 3311", "Female", 98_000, 0, 40_000],
  ["Daniel Eshiett", "DSP/2021/007", "SS 3A", "SS", "Pastor Eshiett", "+234 807 118 2204", "Male", 176_000, 20_000, 156_000],
  ["Amarachi Nwosu", "DSP/2024/205", "KG 2", "KG", "Mrs. Ifeoma Nwosu", "+234 813 442 7788", "Female", 82_000, 0, 82_000],
  ["Ibrahim Yusuf", "DSP/2023/077", "JSS 1A", "JSS", "Mal. Yusuf Sadiq", "+234 806 552 9034", "Male", 126_000, 0, 0],
  ["Blessing Ogar", "DSP/2022/064", "Primary 6", "Primary", "Mr. Peter Ogar", "+234 809 330 5567", "Female", 104_000, 8_000, 60_000],
  ["Samuel Aluko", "DSP/2023/091", "JSS 3B", "JSS", "Dr. Kunle Aluko", "+234 811 209 6642", "Male", 138_000, 0, 138_000],
  ["Halima Sule", "DSP/2025/301", "Primary 1", "Primary", "Mrs. Sule Aisha", "+234 814 771 2298", "Female", 92_000, 0, 30_000],
  ["Oluwaseun Fashola", "DSP/2021/012", "SS 2A", "SS", "Mr. Bode Fashola", "+234 803 664 8890", "Male", 172_000, 0, 172_000],
  ["Precious Ede", "DSP/2024/188", "KG 1", "KG", "Mrs. Rita Ede", "+234 810 445 1176", "Female", 78_000, 6_000, 44_000],
  ["Chinedu Obi", "DSP/2022/033", "Primary 5", "Primary", "Mr. Obi Chukwuma", "+234 802 118 4453", "Male", 100_000, 0, 100_000],
];

export const STUDENTS: Student[] = raw.map((r, i) => {
  const [name, admissionNo, className, section, guardian, guardianPhone, gender, fee, discount, paid] = r;
  const payable = fee - discount;
  const status: Student["status"] = paid >= payable ? "Paid" : paid > 0 ? "Part Payment" : "Owing";
  return {
    id: `s${i + 1}`,
    name,
    admissionNo,
    className,
    section,
    guardian,
    guardianPhone,
    guardianEmail: `${guardian.split(" ").pop()!.toLowerCase()}@gmail.com`,
    gender,
    dob: ["12 Mar 2011", "04 Jul 2009", "22 Sep 2014", "18 Jan 2008", "09 Nov 2019", "27 Apr 2012", "15 Jun 2013", "02 Feb 2010", "30 Aug 2018", "11 Dec 2009", "19 May 2020", "07 Oct 2013"][i],
    address: ["Ketu, Lagos", "Ojota, Lagos", "Mile 12, Lagos", "Ikorodu, Lagos", "Ketu, Lagos", "Agric, Lagos", "Owode, Lagos", "Ojota, Lagos", "Mile 12, Lagos", "Ikeja, Lagos", "Ketu, Lagos", "Ogudu, Lagos"][i],
    fee,
    discount,
    paid,
    status,
    joined: ["Sep 2023", "Sep 2022", "Jan 2024", "Sep 2021", "Sep 2024", "Sep 2023", "Sep 2022", "Sep 2023", "Sep 2025", "Sep 2021", "Jan 2024", "Sep 2022"][i],
  };
});

export const outstanding = (s: Student) => Math.max(s.fee - s.discount - s.paid, 0);
export const getStudent = (id: string) => STUDENTS.find((s) => s.id === id);

export const STUDENT_PAYMENTS = [
  { id: "RCP-10442", date: "18 Feb 2026", items: "School Fees (part)", amount: 60_000, method: "Transfer", by: "Mrs. Grace A." },
  { id: "RCP-10318", date: "02 Feb 2026", items: "Books, Exercise Books", amount: 18_500, method: "Cash", by: "Mr. Sunday O." },
  { id: "RCP-10190", date: "14 Jan 2026", items: "School Fees (part)", amount: 72_000, method: "POS", by: "Mrs. Grace A." },
  { id: "RCP-09980", date: "06 Jan 2026", items: "Uniform (2 sets), Sneakers", amount: 26_000, method: "Transfer", by: "Mr. Sunday O." },
];

export const STUDENT_PURCHASES = [
  { item: "Textbook Bundle — JSS 2", qty: 1, unit: 24_500, date: "02 Feb 2026" },
  { item: "Uniform Set", qty: 2, unit: 9_500, date: "06 Jan 2026" },
  { item: "School Sneakers", qty: 1, unit: 12_000, date: "06 Jan 2026" },
  { item: "Exercise Books (dozen)", qty: 2, unit: 3_600, date: "02 Feb 2026" },
];

/* --------------------------------- Classes -------------------------------- */

export type SchoolClass = {
  id: string;
  name: string;
  section: Section;
  teacher: string;
  students: number;
  expected: number;
  collected: number;
  teacherSalary: number;
  expenses: number;
};

export const CLASSES: SchoolClass[] = [
  { id: "kg1", name: "KG 1", section: "KG", teacher: "Miss Tolu Ajayi", students: 32, expected: 2_496_000, collected: 2_010_000, teacherSalary: 780_000, expenses: 210_000 },
  { id: "kg2", name: "KG 2", section: "KG", teacher: "Miss Ruth Danladi", students: 36, expected: 2_944_000, collected: 2_300_000, teacherSalary: 810_000, expenses: 190_000 },
  { id: "pri1", name: "Primary 1", section: "Primary", teacher: "Mrs. Ada Umeh", students: 28, expected: 2_576_000, collected: 1_940_000, teacherSalary: 840_000, expenses: 175_000 },
  { id: "pri4", name: "Primary 4", section: "Primary", teacher: "Mr. Femi Kolawole", students: 30, expected: 2_940_000, collected: 2_260_000, teacherSalary: 870_000, expenses: 205_000 },
  { id: "pri5", name: "Primary 5", section: "Primary", teacher: "Mrs. Ngozi Iwu", students: 26, expected: 2_600_000, collected: 2_080_000, teacherSalary: 900_000, expenses: 160_000 },
  { id: "pri6", name: "Primary 6", section: "Primary", teacher: "Mr. Segun Bello", students: 24, expected: 2_496_000, collected: 1_760_000, teacherSalary: 930_000, expenses: 220_000 },
  { id: "jss1", name: "JSS 1A", section: "JSS", teacher: "Mr. Chuka Eze", students: 34, expected: 4_284_000, collected: 3_010_000, teacherSalary: 960_000, expenses: 245_000 },
  { id: "jss2", name: "JSS 2A", section: "JSS", teacher: "Mrs. Bisi Lawal", students: 30, expected: 3_960_000, collected: 2_870_000, teacherSalary: 990_000, expenses: 230_000 },
  { id: "jss3", name: "JSS 3B", section: "JSS", teacher: "Mr. Ola Dosunmu", students: 28, expected: 3_864_000, collected: 2_540_000, teacherSalary: 1_020_000, expenses: 260_000 },
  { id: "ss1", name: "SS 1B", section: "SS", teacher: "Mrs. Helen Okafor", students: 26, expected: 4_368_000, collected: 2_620_000, teacherSalary: 1_080_000, expenses: 280_000 },
  { id: "ss2", name: "SS 2A", section: "SS", teacher: "Mr. Yemi Ogundipe", students: 27, expected: 4_644_000, collected: 2_710_000, teacherSalary: 1_110_000, expenses: 295_000 },
  { id: "ss3", name: "SS 3A", section: "SS", teacher: "Mr. Isaac Nwafor", students: 25, expected: 4_400_000, collected: 2_220_000, teacherSalary: 1_170_000, expenses: 310_000 },
];

export const getClass = (id: string) => CLASSES.find((c) => c.id === id);

/* ------------------------------- Inventory -------------------------------- */

export const INVENTORY = [
  { id: "inv1", name: "Textbooks", category: "Books", stock: 486, sold: 214, cost: 16_500, price: 24_500 },
  { id: "inv2", name: "Uniforms", category: "Uniforms", stock: 240, sold: 168, cost: 6_200, price: 9_500 },
  { id: "inv3", name: "Sneakers", category: "Sneakers", stock: 96, sold: 82, cost: 8_400, price: 12_000 },
  { id: "inv4", name: "Exercise Books", category: "Exercise Books", stock: 1_240, sold: 620, cost: 2_100, price: 3_600 },
  { id: "inv5", name: "ID Cards", category: "ID Cards", stock: 310, sold: 402, cost: 900, price: 2_000 },
  { id: "inv6", name: "Stationery Pack", category: "Stationery", stock: 58, sold: 190, cost: 1_800, price: 3_200 },
];

/* -------------------------------- Expenses -------------------------------- */

export const EXPENSES = [
  { id: "EXP-2214", date: "20 Feb 2026", category: "Salaries", desc: "February teaching staff salaries", paidTo: "Payroll — 24 staff", amount: 3_100_000, method: "Transfer" },
  { id: "EXP-2213", date: "19 Feb 2026", category: "Utilities", desc: "Diesel for generator (400L)", paidTo: "Zenith Petroleum", amount: 480_000, method: "Transfer" },
  { id: "EXP-2212", date: "18 Feb 2026", category: "Maintenance", desc: "Repair of JSS block windows", paidTo: "Adeleke Works Ltd", amount: 142_500, method: "Cash" },
  { id: "EXP-2211", date: "16 Feb 2026", category: "Inventory Purchase", desc: "Restock textbooks — 120 units", paidTo: "Learn Africa Plc", amount: 1_980_000, method: "Transfer" },
  { id: "EXP-2210", date: "14 Feb 2026", category: "Transport", desc: "School bus servicing", paidTo: "AutoCare Ikorodu", amount: 265_000, method: "POS" },
  { id: "EXP-2209", date: "12 Feb 2026", category: "Utilities", desc: "IKEDC electricity bill", paidTo: "Ikeja Electric", amount: 318_000, method: "Transfer" },
  { id: "EXP-2208", date: "10 Feb 2026", category: "Feeding", desc: "KG feeding programme supplies", paidTo: "Mama Bola Foods", amount: 196_000, method: "Cash" },
  { id: "EXP-2207", date: "08 Feb 2026", category: "Examination", desc: "WAEC registration deposit", paidTo: "WAEC Nigeria", amount: 740_000, method: "Transfer" },
];

export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Utilities",
  "Maintenance",
  "Inventory Purchase",
  "Transport",
  "Feeding",
  "Examination",
  "Miscellaneous",
];

/* ---------------------------------- Staff --------------------------------- */

export const STAFF = [
  { id: "st1", name: "Mr. Isaac Nwafor", role: "Head Teacher", section: "SS", salary: 195_000, status: "Active", phone: "+234 803 111 2233" },
  { id: "st2", name: "Mrs. Grace Adeyemi", role: "Bursar", section: "Administration", salary: 180_000, status: "Active", phone: "+234 805 442 1190" },
  { id: "st3", name: "Mr. Sunday Okoro", role: "Secretary", section: "Administration", salary: 120_000, status: "Active", phone: "+234 807 552 3311" },
  { id: "st4", name: "Mrs. Bisi Lawal", role: "Class Teacher", section: "JSS", salary: 145_000, status: "Active", phone: "+234 811 664 2210" },
  { id: "st5", name: "Miss Tolu Ajayi", role: "Class Teacher", section: "KG", salary: 110_000, status: "Active", phone: "+234 802 774 8890" },
  { id: "st6", name: "Mr. Femi Kolawole", role: "Class Teacher", section: "Primary", salary: 132_000, status: "Active", phone: "+234 814 220 9911" },
  { id: "st7", name: "Mrs. Helen Okafor", role: "Subject Teacher", section: "SS", salary: 155_000, status: "On Leave", phone: "+234 809 331 4477" },
  { id: "st8", name: "Mr. Amos Bature", role: "Security", section: "Support", salary: 65_000, status: "Active", phone: "+234 806 118 5522" },
];

/* -------------------------------- Payments -------------------------------- */

export const RECENT_PAYMENTS = [
  { receipt: "RCP-10488", student: "Chiamaka Okonkwo", className: "JSS 2A", items: "School Fees", amount: 132_000, method: "Transfer", date: "Today, 10:24" },
  { receipt: "RCP-10487", student: "Zainab Bello", className: "Primary 4", items: "School Fees (part)", amount: 40_000, method: "Cash", date: "Today, 09:51" },
  { receipt: "RCP-10486", student: "Precious Ede", className: "KG 1", items: "Books, Uniform", amount: 34_000, method: "POS", date: "Today, 09:12" },
  { receipt: "RCP-10485", student: "Samuel Aluko", className: "JSS 3B", items: "School Fees", amount: 138_000, method: "Transfer", date: "Yesterday" },
  { receipt: "RCP-10484", student: "Blessing Ogar", className: "Primary 6", items: "Lesson Fee, Sneakers", amount: 27_500, method: "Cash", date: "Yesterday" },
];

export const PAYMENT_ITEMS = [
  { id: "fees", label: "School Fees", amount: 132_000 },
  { id: "books", label: "Books", amount: 24_500 },
  { id: "uniform", label: "Uniform", amount: 9_500 },
  { id: "sneakers", label: "Sneakers", amount: 12_000 },
  { id: "exam", label: "Exam Fee", amount: 15_000 },
  { id: "lesson", label: "Lesson Fee", amount: 18_000 },
];

export const BANK_ACCOUNTS = [
  "Zenith Bank — 1023445671 (Main)",
  "GTBank — 0198442310 (Fees)",
  "Moniepoint POS — Terminal 2",
  "Cash Office",
];

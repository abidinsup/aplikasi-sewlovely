"use client";

// Initial Seed Data
const INITIAL_PRODUCTS = [
    // Gorden Rumah
    { id: 1, name: "Gorden Blackout Premium", category: "Gorden", price: 150000, unit: "per m" },
    { id: 2, name: "Gorden Dimout Standard", category: "Gorden", price: 100000, unit: "per m" },
    { id: 3, name: "Vitrace Import Voile", category: "Gorden", price: 85000, unit: "per m" },
    { id: 4, name: "Biaya Dasar (Jahit & Pasang)", category: "Gorden", price: 800000, unit: "per set" },
    { id: 5, name: "Aksesoris Smokering", category: "Gorden", price: 75000, unit: "per set" },
    { id: 6, name: "Aksesoris Cantel", category: "Gorden", price: 50000, unit: "per set" },

    // Gorden Kantor
    { id: 11, name: "Roller Blind Sunscreen", category: "Kantor", price: 295000, unit: "per m2" },
    { id: 12, name: "Vertical Blind Standard", category: "Kantor", price: 185000, unit: "per m2" },
    { id: 13, name: "Venetian Blind Aluminum", category: "Kantor", price: 250000, unit: "per m2" },

    // Gorden RS
    { id: 21, name: "Kain Anti Bakteri", category: "Hospital", price: 150000, unit: "per m2" },
    { id: 22, name: "Kain Anti Darah", category: "Hospital", price: 250000, unit: "per m2" },
    { id: 23, name: "Rel Flexy Curved", category: "Hospital", price: 100000, unit: "per m" },
    { id: 24, name: "Rel Standard straight", category: "Hospital", price: 50000, unit: "per m" },

    // Sprei
    { id: 31, name: "Sprei Single Small (90x200)", category: "Sprei", price: 150000, unit: "pcs" },
    { id: 32, name: "Sprei Single (100x200)", category: "Sprei", price: 165000, unit: "pcs" },
    { id: 33, name: "Sprei Double (120x200)", category: "Sprei", price: 180000, unit: "pcs" },
    { id: 34, name: "Sprei Queen (160x200)", category: "Sprei", price: 220000, unit: "pcs" },
    { id: 35, name: "Sprei King (180x200)", category: "Sprei", price: 240000, unit: "pcs" },
    { id: 36, name: "Sprei Extra King (200x200)", category: "Sprei", price: 260000, unit: "pcs" },

    // Bedcover
    { id: 41, name: "Bedcover Single (100x200)", category: "Bedcover", price: 300000, unit: "pcs" },
    { id: 42, name: "Bedcover Super Single (120x200)", category: "Bedcover", price: 325000, unit: "pcs" },
    { id: 43, name: "Bedcover Queen (160x200)", category: "Bedcover", price: 400000, unit: "pcs" },
    { id: 44, name: "Bedcover King (180x200)", category: "Bedcover", price: 450000, unit: "pcs" },
    { id: 45, name: "Bedcover Super King (200x200)", category: "Bedcover", price: 500000, unit: "pcs" },
];

const STORAGE_KEYS = {
    PRODUCTS: 'sl_products',
    INVOICES: 'sl_invoices_v2', // Changed to force re-seed
    WITHDRAWALS: 'sl_withdrawals',
    PARTNERS: 'sl_partners'
};

const INITIAL_INVOICES = [
    // 2025 DATA (LAST YEAR)
    {
        id: "INV-25-01", type: "gorden", date: "15 Januari 2025", amount: 2000000, status: "paid",
        customer: "Cust 2025 A", mitraId: "SL-MITRA-001", mitraName: "Siti Aminah", details: {}
    },
    {
        id: "INV-25-03", type: "sprei", date: "10 Maret 2025", amount: 1500000, status: "paid",
        customer: "Cust 2025 B", mitraId: "SL-MITRA-002", mitraName: "Andi Saputra", details: {}
    },
    {
        id: "INV-25-06", type: "bedcover", date: "20 Juni 2025", amount: 3000000, status: "paid",
        customer: "Cust 2025 C", mitraId: "SL-MITRA-003", mitraName: "Citra Lestari", details: {}
    },
    {
        id: "INV-25-09", type: "rs", date: "05 September 2025", amount: 5000000, status: "paid",
        customer: "Cust 2025 D", mitraId: "SL-MITRA-001", mitraName: "Siti Aminah", details: {}
    },
    {
        id: "INV-25-12", type: "gorden", date: "10 Desember 2025", amount: 4200000, status: "paid",
        customer: "Cust 2025 E", mitraId: "SL-MITRA-005", mitraName: "Eko Prasetyo", details: {}
    },

    // 2026 DATA (CURRENT YEAR)
    // FEBRUARY (Existing)
    {
        id: "INV-SP-112233",
        type: "sprei",
        date: "05 Februari 2026",
        amount: 690000,
        status: "paid",
        customer: "Bu Rini",
        mitraId: "SL-MITRA-004",
        mitraName: "Budi Santoso",
        details: { /* Simplified for list view */ }
    },
    {
        id: "INV-BC-885522",
        type: "bedcover",
        date: "06 Februari 2026",
        amount: 450000,
        status: "pending",
        customer: "Pak Hendra",
        mitraId: "SL-MITRA-004",
        mitraName: "Budi Santoso",
        details: {}
    },
    {
        id: "INV-RS-774411",
        type: "rs",
        date: "05 Februari 2026",
        amount: 8750000,
        status: "paid",
        customer: "RS Sehat Selalu",
        mitraId: "SL-MITRA-002",
        mitraName: "Andi Saputra",
        details: {}
    },
    // JANUARY
    {
        id: "INV-GD-100101",
        type: "gorden",
        date: "15 Januari 2026",
        amount: 2500000,
        status: "paid",
        customer: "Ibu Ani",
        mitraId: "SL-MITRA-001",
        mitraName: "Siti Aminah",
        details: {}
    },
    {
        id: "INV-GD-100102",
        type: "gorden",
        date: "20 Januari 2026",
        amount: 1800000,
        status: "paid",
        customer: "Pak Joko",
        mitraId: "SL-MITRA-003",
        mitraName: "Citra Lestari",
        details: {}
    },
    // MARCH (Projected/Recent)
    {
        id: "INV-SP-300101",
        type: "sprei",
        date: "02 Maret 2026",
        amount: 550000,
        status: "paid",
        customer: "Ibu Dian",
        mitraId: "SL-MITRA-001",
        mitraName: "Siti Aminah",
        details: {}
    },
    {
        id: "INV-BC-300102",
        type: "bedcover",
        date: "10 Maret 2026",
        amount: 1200000,
        status: "paid",
        customer: "Hotel Mawar",
        mitraId: "SL-MITRA-005",
        mitraName: "Eko Prasetyo",
        details: {}
    },
    // APRIL (Future Logic Test)
    // APRIL
    {
        id: "INV-RS-400101",
        type: "rs",
        date: "05 April 2026",
        amount: 5000000,
        status: "paid",
        customer: "Klinik Medika",
        mitraId: "SL-MITRA-002",
        mitraName: "Andi Saputra",
        details: {}
    },
    // MAY
    {
        id: "INV-GD-500101",
        type: "gorden",
        date: "12 Mei 2026",
        amount: 3200000,
        status: "paid",
        customer: "Bu Ratna",
        mitraId: "SL-MITRA-001",
        mitraName: "Siti Aminah",
        details: {}
    },
    // JUNE
    {
        id: "INV-SP-600101",
        type: "sprei",
        date: "08 Juni 2026",
        amount: 1500000,
        status: "paid",
        customer: "Pak Bambang",
        mitraId: "SL-MITRA-003",
        mitraName: "Citra Lestari",
        details: {}
    },
    // JULY - Peak Season
    {
        id: "INV-BC-700101",
        type: "bedcover",
        date: "04 Juli 2026",
        amount: 4800000,
        status: "paid",
        customer: "Hotel Indah",
        mitraId: "SL-MITRA-005",
        mitraName: "Eko Prasetyo",
        details: {}
    },
    {
        id: "INV-GD-700102",
        type: "gorden",
        date: "15 Juli 2026",
        amount: 2100000,
        status: "paid",
        customer: "Ibu Sari",
        mitraId: "SL-MITRA-001",
        mitraName: "Siti Aminah",
        details: {}
    },
    // AUGUST
    {
        id: "INV-GD-800101",
        type: "gorden",
        date: "20 Agustus 2026",
        amount: 1900000,
        status: "paid",
        customer: "Pak Tono",
        mitraId: "SL-MITRA-004",
        mitraName: "Budi Santoso",
        details: {}
    },
    // SEPTEMBER
    {
        id: "INV-RS-900101",
        type: "rs",
        date: "05 September 2026",
        amount: 3500000,
        status: "paid",
        customer: "RS Sentosa",
        mitraId: "SL-MITRA-002",
        mitraName: "Andi Saputra",
        details: {}
    },
    // OCTOBER
    {
        id: "INV-SP-100101",
        type: "sprei",
        date: "10 Oktober 2026",
        amount: 4200000,
        status: "paid",
        customer: "Asrama Putri",
        mitraId: "SL-MITRA-001",
        mitraName: "Siti Aminah",
        details: {}
    },
    // NOVEMBER
    {
        id: "INV-BC-110101",
        type: "bedcover",
        date: "15 November 2026",
        amount: 2800000,
        status: "paid",
        customer: "Ibu Lina",
        mitraId: "SL-MITRA-003",
        mitraName: "Citra Lestari",
        details: {}
    },
    // DECEMBER
    {
        id: "INV-GD-120101",
        type: "gorden",
        date: "01 Desember 2026",
        amount: 5500000,
        status: "paid",
        customer: "Gedung Serbaguna",
        mitraId: "SL-MITRA-005",
        mitraName: "Eko Prasetyo",
        details: {}
    }
];

const INITIAL_WITHDRAWALS = [
    {
        id: "WD-REQ-001",
        mitra: "Siti Aminah",
        mitraId: "SL-MITRA-001",
        amount: 2500000,
        bank: "BCA",
        accountNumber: "1234567890",
        date: "04 Feb 2026",
        status: "pending"
    }
];

// PARTNERS (NEW)
const INITIAL_PARTNERS = [
    { id: "SL-MITRA-001", name: "Siti Aminah", joinDate: "01 Januari 2026", status: "Active", totalSales: 15600000 },
    { id: "SL-MITRA-002", name: "Andi Saputra", joinDate: "10 Januari 2026", status: "Active", totalSales: 8900000 },
    { id: "SL-MITRA-003", name: "Citra Lestari", joinDate: "15 Januari 2026", status: "Active", totalSales: 4200000 },
    { id: "SL-MITRA-004", name: "Budi Santoso", joinDate: "02 Februari 2026", status: "Inactive", totalSales: 0 },
    { id: "SL-MITRA-005", name: "Eko Prasetyo", joinDate: "05 Maret 2026", status: "Active", totalSales: 1200000 },
];

// --- Storage Service ---

const getStorageData = (key: string, initialData: any) => {
    if (typeof window === 'undefined') return initialData;
    const stored = localStorage.getItem(key);
    if (!stored) {
        localStorage.setItem(key, JSON.stringify(initialData));
        return initialData;
    }
    return JSON.parse(stored);
};

export const storageService = {
    // PRODUCTS
    getProducts: () => getStorageData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),

    updateProduct: (id: number, newPrice: number) => {
        const products = getStorageData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const updated = products.map((p: any) => p.id === id ? { ...p, price: newPrice } : p);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
    },

    addProduct: (product: any) => {
        const products = getStorageData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        const newProducts = [...products, product];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
        return newProducts;
    },

    // INVOICES (SALES)
    getInvoices: () => getStorageData(STORAGE_KEYS.INVOICES, INITIAL_INVOICES),

    addInvoice: (invoice: any) => {
        const invoices = getStorageData(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
        const newInvoices = [invoice, ...invoices];
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(newInvoices));
        return newInvoices;
    },

    // WITHDRAWALS
    getWithdrawals: () => getStorageData(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS),

    addWithdrawal: (withdrawal: any) => {
        const list = getStorageData(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
        const newList = [withdrawal, ...list];
        localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(newList));
        return newList;
    },

    updateWithdrawalStatus: (id: string, status: 'approved' | 'rejected') => {
        const list = getStorageData(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
        const updated = list.map((w: any) => w.id === id ? { ...w, status: status } : w);
        localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(updated));
        return updated;
    },

    // PARTNERS
    getPartners: () => getStorageData(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS),

    updatePartnerStatus: (id: string, status: 'Active' | 'Inactive') => {
        const partners = getStorageData(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS);
        const updated = partners.map((p: any) => p.id === id ? { ...p, status: status } : p);
        localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(updated));
        return updated;
    },

    // DASHBOARD STATS
    getAdminStats: () => {
        const invoices = getStorageData(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
        const withdrawals = getStorageData(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
        const partners = getStorageData(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS);

        const totalOmset = invoices.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'pending').length;
        const totalMitra = partners.length;

        return {
            totalOmset,
            pendingWithdrawals,
            totalMitra
        };
    }
};

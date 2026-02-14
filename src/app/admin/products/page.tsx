"use client";

import * as React from "react";
import { Search, Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { getProducts, addProduct, updateProduct, deleteProduct, Product } from "@/lib/products";

export default function ProductManagementPage() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [editPrice, setEditPrice] = React.useState<number>(0);
    const [editName, setEditName] = React.useState<string>("");
    const [searchQuery, setSearchQuery] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState(true);

    // Add Product State
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [newProduct, setNewProduct] = React.useState({
        name: "",
        category: "Gorden",
        price: 0,
        unit: "per m"
    });

    React.useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        const result = await getProducts();
        if (result.success && result.data) {
            setProducts(result.data);
        } else {
            toast.error("Gagal mengambil data produk");
        }
        setIsLoading(false);
    };

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setEditPrice(product.price);
        setEditName(product.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditPrice(0);
        setEditName("");
    };

    const saveEdit = async (product: Product) => {
        try {
            const updates: Partial<Product> = {};
            if (editPrice !== product.price) updates.price = editPrice;
            if (editName !== product.name) updates.name = editName;

            if (Object.keys(updates).length === 0) {
                cancelEdit();
                return;
            }

            console.log("Updating product:", product.id, updates);
            const result = await updateProduct(product.id, updates);
            console.log("Update result:", result);
            if (result.success) {
                toast.success("Produk Berhasil Diupdate");
                // Update local state directly for immediate UI feedback
                setProducts(prev => prev.map(p =>
                    p.id === product.id ? { ...p, ...updates } : p
                ));
                cancelEdit();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            console.error("Update failed:", err);
            toast.error("Gagal mengupdate produk", { description: err.message });
        }
    };

    const handleAddProduct = async () => {
        if (!newProduct.name) {
            toast.error("Mohon lengkapi nama produk");
            return;
        }

        try {
            const result = await addProduct(newProduct);
            if (result.success) {
                toast.success("Produk Baru Ditambahkan");
                setIsAddModalOpen(false);
                setNewProduct({ name: "", category: "Gorden", price: 0, unit: "per m" }); // Reset form
                fetchProducts();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast.error("Gagal menambahkan produk", { description: err.message });
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

        try {
            const result = await deleteProduct(id);
            if (result.success) {
                toast.success("Produk Berhasil Dihapus");
                setProducts(prev => prev.filter(p => p.id !== id));
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast.error("Gagal menghapus produk", { description: err.message });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedProducts = [...filteredProducts].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Produk</h1>
                    <p className="text-slate-500">Atur harga dasar produk Sewlovely</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white gap-2">
                    <Plus className="h-4 w-4" /> Tambah Produk
                </Button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari produk..."
                                className="!pl-10 bg-white border-slate-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="bg-[#63e5ff] text-slate-900 font-bold hover:bg-cyan-400 shadow-sm shadow-cyan-400/20">
                            Cari
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Nama Produk</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Harga Satuan</th>
                                <th className="p-4 text-right rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">Memuat produk...</td>
                                </tr>
                            ) : sortedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400">Belum ada produk.</td>
                                </tr>
                            ) : sortedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-slate-700">
                                        {editingId === product.id ? (
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-8 max-w-sm"
                                            />
                                        ) : (
                                            product.name
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase">{product.category}</span>
                                    </td>
                                    <td className="p-4">
                                        {editingId === product.id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 font-bold text-xs">Rp</span>
                                                <Input
                                                    type="number"
                                                    value={editPrice}
                                                    onChange={(e) => setEditPrice(Number(e.target.value))}
                                                    className="w-32 h-8 text-right font-bold"
                                                />
                                                <span className="text-slate-400 text-xs">/{product.unit}</span>
                                            </div>
                                        ) : (
                                            <div className="font-bold text-slate-900">
                                                Rp {product.price.toLocaleString("id-ID")} <span className="text-slate-400 text-xs font-normal">/{product.unit}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {editingId === product.id ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" onClick={() => saveEdit(product)} className="bg-emerald-600 hover:bg-emerald-500 h-8 w-8 p-0 rounded-full">
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0 rounded-full">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(product)} className="text-slate-400 hover:text-slate-900 h-8 w-8 p-0 rounded-full">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(product.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0 rounded-full transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD PRODUCT MODAL OVERLAY */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-bold text-slate-900">Tambah Produk Baru</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)} className="rounded-full text-slate-400 hover:bg-slate-50">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Nama Produk</label>
                                <Input
                                    placeholder="Contoh: Gorden Motif Bunga"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Kategori</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        <option value="Gorden">Gorden</option>
                                        <option value="Kantor">Kantor</option>
                                        <option value="Sprei">Sprei</option>
                                        <option value="Bedcover">Bedcover</option>
                                        <option value="Hospital">Hospital</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Satuan</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={newProduct.unit}
                                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                    >
                                        <option value="per m">per m</option>
                                        <option value="per m2">per m²</option>
                                        <option value="pcs">pcs</option>
                                        <option value="per set">per set</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Harga Dasar</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                                    <Input
                                        type="number"
                                        className="pl-9 font-bold text-slate-900"
                                        placeholder="0"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                            <Button
                                disabled={!newProduct.name}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleAddProduct}
                            >
                                Simpan Produk
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

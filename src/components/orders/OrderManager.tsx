import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Printer,
  MessageCircle,
  Mail,
  CheckCircle2,
  Clock,
  Trash2,
  Building2,
  Ship,
  Store,
  FileText,
  CreditCard,
  Send,
  QrCode,
  Package
} from 'lucide-react';
import { ShippingLabelModal } from '../logistics/ShippingLabelModal';
import {
  Order,
  OrderItem,
  CoffeeBean,
  PricingTier,
  IslandRegion,
  OrderStatus,
  PaymentStatus,
  QrisPaymentConfig
} from '../../types/erp';
import {
  formatIDR,
  saveOrder,
  updateOrderStatus,
  buildWhatsAppLink,
  getPriceByTier,
  saveNotificationLog,
  getQrisConfig,
  subscribeToQrisConfig,
  DEFAULT_QRIS_CONFIG
} from '../../services/dbService';

interface OrderManagerProps {
  orders: Order[];
  beans: CoffeeBean[];
  onRefresh: () => void;
  onOpenNewOrderModal?: () => void;
}

export const OrderManager: React.FC<OrderManagerProps> = ({
  orders,
  beans,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Order | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [qrisConfig, setQrisConfig] = useState<QrisPaymentConfig>(DEFAULT_QRIS_CONFIG);

  React.useEffect(() => {
    const unsub = subscribeToQrisConfig(setQrisConfig);
    return () => unsub();
  }, []);

  // New Order Form state
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<PricingTier>('Lokal');
  const [customerPhone, setCustomerPhone] = useState('628123456789');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [destinationIsland, setDestinationIsland] = useState<IslandRegion>('Jawa');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      beanId: beans[0]?.id || '',
      beanName: beans[0]?.name || '',
      type: 'Green Bean',
      quantityKg: 20,
      tierUsed: 'Lokal',
      unitPrice: beans[0]?.priceLocalPerKg || 140000,
      subtotal: (beans[0]?.priceLocalPerKg || 140000) * 20
    }
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(75000);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (beans.length > 0 && (!orderItems[0]?.beanId || !beans.some((b) => b.id === orderItems[0]?.beanId))) {
      const firstBean = beans[0];
      const price = getPriceByTier(firstBean, customerType);
      setOrderItems([
        {
          beanId: firstBean.id,
          beanName: firstBean.name,
          type: 'Green Bean',
          quantityKg: 20,
          tierUsed: customerType,
          unitPrice: price,
          subtotal: price * 20
        }
      ]);
    }
  }, [beans, customerType]);

  // Handle tier change: recalculate unit price for all lines
  const handleCustomerTypeChange = (newTier: PricingTier) => {
    setCustomerType(newTier);
    setOrderItems((prev) =>
      prev.map((item) => {
        const bean = beans.find((b) => b.id === item.beanId);
        const unitPrice = bean ? getPriceByTier(bean, newTier) : item.unitPrice;
        return {
          ...item,
          tierUsed: newTier,
          unitPrice,
          subtotal: unitPrice * item.quantityKg
        };
      })
    );
  };

  const addItemRow = () => {
    const firstBean = beans[0];
    if (!firstBean) return;
    const price = getPriceByTier(firstBean, customerType);
    setOrderItems([
      ...orderItems,
      {
        beanId: firstBean.id,
        beanName: firstBean.name,
        type: 'Green Bean',
        quantityKg: 10,
        tierUsed: customerType,
        unitPrice: price,
        subtotal: price * 10
      }
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const updateItemRow = (
    idx: number,
    field: 'beanId' | 'type' | 'quantityKg',
    value: string | number
  ) => {
    setOrderItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        let bean = beans.find((b) => b.id === item.beanId);

        if (field === 'beanId') {
          bean = beans.find((b) => b.id === value);
          const unitPrice = bean ? getPriceByTier(bean, customerType) : item.unitPrice;
          return {
            ...item,
            beanId: String(value),
            beanName: bean ? bean.name : item.beanName,
            unitPrice,
            subtotal: unitPrice * item.quantityKg
          };
        } else if (field === 'quantityKg') {
          const qty = Number(value);
          return {
            ...item,
            quantityKg: qty,
            subtotal: item.unitPrice * qty
          };
        } else {
          return {
            ...item,
            type: value as OrderItem['type']
          };
        }
      })
    );
  };

  // Subtotals
  const totalWeightKg = orderItems.reduce((sum, item) => sum + item.quantityKg, 0);
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = Math.max(0, subtotal - discount + shippingCost);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || orderItems.length === 0) return;

    const invoiceNumber = `INV/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: `ord-${Date.now().toString(36)}`,
      invoiceNumber,
      customerName,
      customerType,
      customerPhone,
      customerEmail: customerEmail || 'customer@kopiflow-client.com',
      customerAddress: customerAddress || 'Alamat Belum Diatur',
      destinationIsland,
      items: orderItems,
      totalWeightKg,
      subtotal,
      discount,
      tax: 0,
      shippingCost,
      grandTotal,
      status: 'Confirmed',
      paymentStatus: 'Paid in Full',
      orderDate: new Date().toISOString().split('T')[0],
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Tutup menu modal seketika agar tidak loading lama di depan user
    setIsNewOrderModalOpen(false);

    // Reset customer input fields for next order
    setCustomerName('');
    setNotes('');

    // Save order & notification asynchronously
    await Promise.all([
      saveOrder(newOrder, beans),
      saveNotificationLog({
        id: `notif-${Date.now().toString(36)}`,
        channel: 'WhatsApp',
        recipient: customerPhone,
        subject: `Invoice & Konfirmasi Pesanan ${invoiceNumber}`,
        messagePreview: `Halo ${customerName}, pesanan tier ${customerType} Anda (${invoiceNumber}) total ${formatIDR(grandTotal)} telah dikonfirmasi oleh Gudang KopiFlow.`,
        type: 'Order Invoice',
        status: 'Sent',
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdAt: new Date().toISOString()
      })
    ]);

    onRefresh();
  };

  const handleSendWhatsAppInvoice = (order: Order) => {
    const itemsList = order.items
      .map((it) => `• ${it.beanName} (${it.type}) - ${it.quantityKg} kg @ ${formatIDR(it.unitPrice)} = ${formatIDR(it.subtotal)}`)
      .join('\n');

    const msg = `*FAKTUR PENJUALAN KOPIFLOW WAREHOUSE*\n\n` +
      `No. Invoice: *${order.invoiceNumber}*\n` +
      `Pelanggan: *${order.customerName}* (Tier: *${order.customerType}*)\n` +
      `Tanggal: ${order.orderDate}\n` +
      `Tujuan: ${order.destinationIsland}\n\n` +
      `*RINCIAN ITEM:*\n${itemsList}\n\n` +
      `Subtotal: ${formatIDR(order.subtotal)}\n` +
      `Ongkir: ${formatIDR(order.shippingCost)}\n` +
      `*TOTAL PEMBAYARAN: ${formatIDR(order.grandTotal)}*\n` +
      `Status Pembayaran: *${order.paymentStatus}*\n\n` +
      `Rekening Pembayaran:\n` +
      `BCA: 872-0091-233 a.n PT KopiFlow Nusantara\n` +
      `Terima kasih atas kerja samanya!`;

    const url = buildWhatsAppLink(order.customerPhone, msg);
    window.open(url, '_blank');
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search);
    const matchTier = tierFilter === 'all' || o.customerType === tierFilter;
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. invoice, nama customer..."
              className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs text-zinc-900 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Tier filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">Semua Tier Pelanggan</option>
            <option value="Lokal">Tier Lokal</option>
            <option value="UMKM">Tier Mitra UMKM</option>
            <option value="Luar Pulau">Tier Luar Pulau</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-amber-500 focus:outline-hidden"
          >
            <option value="all">Semua Status Order</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Ready to Ship">Ready to Ship</option>
            <option value="Shipped">Shipped</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Action button */}
        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>+ Buat Order Penjualan</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">No. Invoice & Tanggal</th>
                <th className="py-3 px-3">Pelanggan & Kontak</th>
                <th className="py-3 px-3">Tier Harga Terpilih</th>
                <th className="py-3 px-3">Rincian Item</th>
                <th className="py-3 px-3">Total Bobot & Nilai</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((order) => {
                return (
                  <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Invoice & Date */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-amber-900 text-xs">{order.invoiceNumber}</div>
                      <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{order.orderDate}</div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900 text-xs">{order.customerName}</div>
                      <div className="text-[11px] text-zinc-500">{order.customerPhone}</div>
                      <div className="text-[10px] text-blue-600 font-medium">Tujuan: {order.destinationIsland}</div>
                    </td>

                    {/* Customer Tier */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                          order.customerType === 'Lokal'
                            ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                            : order.customerType === 'UMKM'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                      >
                        {order.customerType === 'Lokal' && <Store className="h-3 w-3" />}
                        {order.customerType === 'UMKM' && <Building2 className="h-3 w-3" />}
                        {order.customerType === 'Luar Pulau' && <Ship className="h-3 w-3" />}
                        <span>{order.customerType}</span>
                      </span>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {order.items.slice(0, 2).map((it, i) => (
                          <div key={i} className="text-[11px] text-zinc-700 truncate max-w-[200px]">
                            • {it.beanName} ({it.quantityKg} kg)
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-[10px] text-zinc-400 italic">
                            +{order.items.length - 2} item lainnya
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total Weight & Grand Total */}
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-sm text-zinc-900">
                        {formatIDR(order.grandTotal)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium">
                        Total {order.totalWeightKg} kg • {order.paymentStatus}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          order.status === 'Shipped' || order.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Processing' || order.status === 'Ready to Ship'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderForInvoice(order)}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs"
                          title="Lihat & Cetak Faktur"
                        >
                          <FileText className="h-3 w-3 text-zinc-600" />
                          <span>Faktur</span>
                        </button>

                        <button
                          onClick={() => setSelectedOrderForLabel(order)}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 shadow-2xs"
                          title="Cetak Label Tempel Paket / Surat Jalan"
                        >
                          <Package className="h-3 w-3 text-amber-800" />
                          <span>Label Kirim</span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsAppInvoice(order)}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-800 shadow-2xs"
                          title="Kirim Invoice ke WhatsApp Customer"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>WA</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formal Invoice View Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="text-base font-bold text-zinc-900">Faktur Penjualan Resmi</h3>
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document Body */}
            <div className="mt-4 p-6 border border-zinc-200 rounded-xl bg-white text-zinc-900 font-sans">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <div className="font-extrabold text-base tracking-wider text-amber-900">
                    KOPIFLOW WAREHOUSE & ROAST LAB
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Jl. Kaliurang Km 9,3, Sinduharjo, Sleman, D.I. Yogyakarta 55581
                  </p>
                  <p className="text-xs text-zinc-500">Telp / WA: +62 811-298-0044 | email: sales@kopiflow.id</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-extrabold text-zinc-900 block">
                    {selectedOrderForInvoice.invoiceNumber}
                  </span>
                  <span className="text-xs text-zinc-500 block">
                    Tanggal: {selectedOrderForInvoice.orderDate}
                  </span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedOrderForInvoice.paymentStatus === 'Paid in Full'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrderForInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Customer Box */}
              <div className="grid grid-cols-2 gap-4 my-4 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                <div>
                  <span className="text-zinc-400 block font-semibold uppercase text-[10px]">
                    Ditujukan Kepada:
                  </span>
                  <strong className="text-zinc-900 text-sm block">
                    {selectedOrderForInvoice.customerName}
                  </strong>
                  <span className="text-zinc-600 block">{selectedOrderForInvoice.customerAddress}</span>
                  <span className="text-zinc-500">Kontak: {selectedOrderForInvoice.customerPhone}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-semibold uppercase text-[10px]">
                    Tier Harga & Destinasi:
                  </span>
                  <div className="mt-1">
                    <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                      Tier: {selectedOrderForInvoice.customerType}
                    </span>
                  </div>
                  <span className="text-zinc-600 block mt-1">
                    Pulau Tujuan: <strong>{selectedOrderForInvoice.destinationIsland}</strong>
                  </span>
                  <span className="text-zinc-500 block">Status Kirim: {selectedOrderForInvoice.status}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left text-xs border-collapse my-4">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px]">
                    <th className="py-2">Item Deskripsi</th>
                    <th className="py-2 text-center">Bentuk</th>
                    <th className="py-2 text-right">Qty (kg)</th>
                    <th className="py-2 text-right">Harga ({selectedOrderForInvoice.customerType})</th>
                    <th className="py-2 text-right">Total (IDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {selectedOrderForInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-semibold text-zinc-900">{it.beanName}</td>
                      <td className="py-2 text-center text-zinc-600">{it.type}</td>
                      <td className="py-2 text-right font-mono">{it.quantityKg} kg</td>
                      <td className="py-2 text-right font-mono">{formatIDR(it.unitPrice)}</td>
                      <td className="py-2 text-right font-mono font-bold text-zinc-900">
                        {formatIDR(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="border-t border-zinc-200 pt-3 flex justify-end text-xs">
                <div className="w-64 space-y-1.5 text-zinc-600">
                  <div className="flex justify-between">
                    <span>Subtotal Produk:</span>
                    <span className="font-mono text-zinc-900 font-semibold">
                      {formatIDR(selectedOrderForInvoice.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim / Kargo:</span>
                    <span className="font-mono text-zinc-900">
                      {formatIDR(selectedOrderForInvoice.shippingCost)}
                    </span>
                  </div>
                  {selectedOrderForInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Diskon Kemitraan:</span>
                      <span className="font-mono">-{formatIDR(selectedOrderForInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-sm font-extrabold text-zinc-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-amber-900">
                      {formatIDR(selectedOrderForInvoice.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods: QRIS GoPay & Bank Transfer */}
              <div className="mt-4 pt-3 border-t border-zinc-200">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs">
                  {/* QRIS GoPay Barcode Display */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-zinc-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="font-black text-[10px] tracking-wider text-zinc-900">QRIS</span>
                      <span className="rounded bg-emerald-600 px-1 py-0.2 text-[8px] font-bold text-white">GOPAY</span>
                    </div>
                    {qrisConfig.qrisImageUrl ? (
                      <img
                        src={qrisConfig.qrisImageUrl}
                        alt="QRIS GoPay"
                        className="w-28 h-28 object-contain rounded"
                      />
                    ) : (
                      <div className="w-28 h-28 flex flex-col items-center justify-center text-center p-1 bg-zinc-50 border border-dashed border-zinc-300 rounded">
                        <QrCode className="h-12 w-12 text-emerald-700 opacity-70" />
                        <span className="text-[9px] text-zinc-600 mt-1 font-semibold leading-tight">
                          QRIS GoPay
                        </span>
                      </div>
                    )}
                    <span className="text-[9px] text-zinc-500 mt-1 font-mono">Scan via GoPay / Bank</span>
                  </div>

                  {/* Transfer & Merchant Details */}
                  <div className="sm:col-span-8 flex flex-col justify-center space-y-1.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800">
                        Pembayaran Cepat QRIS:
                      </span>
                      <div className="font-bold text-zinc-900 text-xs">
                        {qrisConfig.merchantName} ({qrisConfig.gopayNumber})
                      </div>
                      <p className="text-[11px] text-zinc-600 leading-tight mt-0.5">
                        {qrisConfig.paymentInstructions}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-zinc-200/80 text-[11px] text-zinc-600">
                      <strong>Rekening Bank Alternatif:</strong>
                      <br />
                      Bank Mandiri: <strong>137-00-19283-009</strong> | BCA: <strong>872-0091-233</strong>
                      <br />
                      A/N: <strong>{qrisConfig.accountHolder || 'PT KopiFlow Indonesia Berjaya'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleSendWhatsAppInvoice(selectedOrderForInvoice)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Kirim Faktur ke WhatsApp Customer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrderForInvoice;
                    setSelectedOrderForInvoice(null);
                    setSelectedOrderForLabel(ord);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  <Package className="h-4 w-4 text-amber-800" />
                  <span>Cetak Label Pengiriman</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Faktur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Sales Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Buat Pesanan Penjualan Baru</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pilih tier harga (Lokal / UMKM / Luar Pulau) untuk kalkulasi harga otomatis
                </p>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4 text-xs">
              {/* Customer & Tier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Nama Pelanggan / Kedai</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="cth: Kopi Kenari / Rian Syahputra"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Tier Harga Penjualan
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Lokal', 'UMKM', 'Luar Pulau'] as PricingTier[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => handleCustomerTypeChange(tier)}
                        className={`rounded-lg py-1.5 text-xs font-bold border transition-colors ${
                          customerType === tier
                            ? tier === 'Lokal'
                              ? 'bg-zinc-800 text-white border-zinc-800'
                              : tier === 'UMKM'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-blue-700 text-white border-blue-700'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="6281234567890"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Email Pelanggan</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="order@kedai.com"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Pulau Tujuan</label>
                  <select
                    value={destinationIsland}
                    onChange={(e) => {
                      const isl = e.target.value as IslandRegion;
                      setDestinationIsland(isl);
                      // Adjust shipping cost estimate
                      if (isl === 'Jawa') setShippingCost(75000);
                      else if (isl === 'Sumatera' || isl === 'Bali & Nusa Tenggara') setShippingCost(280000);
                      else if (isl === 'Kalimantan') setShippingCost(450000);
                      else setShippingCost(650000);
                    }}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="Jawa">Jawa</option>
                    <option value="Sumatera">Sumatera</option>
                    <option value="Kalimantan">Kalimantan</option>
                    <option value="Sulawesi">Sulawesi</option>
                    <option value="Bali & Nusa Tenggara">Bali & Nusa Tenggara</option>
                    <option value="Maluku & Papua">Maluku & Papua</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Alamat Lengkap Pengiriman</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Jl. Raya No..., Kota, Provinsi, Kode Pos"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Order Items Table */}
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 space-y-2">
                <div className="flex items-center justify-between font-bold text-zinc-800">
                  <span>Daftar Biji Kopi (Tier: {customerType})</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-amber-800 text-xs font-semibold hover:underline"
                  >
                    + Tambah Baris Item
                  </button>
                </div>

                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-zinc-200"
                    >
                      <div className="col-span-4">
                        <select
                          value={item.beanId}
                          onChange={(e) => updateItemRow(idx, 'beanId', e.target.value)}
                          className="w-full rounded border border-zinc-200 p-1 text-[11px]"
                        >
                          {beans.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <select
                          value={item.type}
                          onChange={(e) => updateItemRow(idx, 'type', e.target.value)}
                          className="w-full rounded border border-zinc-200 p-1 text-[11px]"
                        >
                          <option value="Green Bean">Green Bean</option>
                          <option value="Roasted Bean">Roasted</option>
                          <option value="Ground">Ground</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantityKg}
                          onChange={(e) => updateItemRow(idx, 'quantityKg', e.target.value)}
                          placeholder="kg"
                          className="w-full rounded border border-zinc-200 p-1 text-[11px] font-mono"
                        />
                      </div>

                      <div className="col-span-3 text-right font-mono font-bold text-zinc-900">
                        {formatIDR(item.subtotal)}
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Diskon (Rp)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Ongkos Kirim Estimasi (Rp)</label>
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Grand Total</label>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 font-extrabold text-sm text-amber-900">
                    {formatIDR(grandTotal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 px-4 py-1.5 font-bold text-white hover:bg-amber-800"
                >
                  Konfirmasi Order & Kurangi Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Label & Surat Jalan Printable Modal */}
      {selectedOrderForLabel && (
        <ShippingLabelModal
          order={selectedOrderForLabel}
          isOpen={!!selectedOrderForLabel}
          onClose={() => setSelectedOrderForLabel(null)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Avatar, Spin, InputNumber, message, Empty } from 'antd';
import { SearchOutlined, PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';

export default function QuickSelectProductModal({ open, onClose, onConfirm, currentLineItems, pricePolicyData }) {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);
  
  // State lưu trữ tạm thời giỏ hàng đang chọn trong Modal: { [productId]: số_lượng }
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const searchTimeoutRef = useRef(null);

  // Đảm bảo chính sách giá luôn là một mảng sạch để tránh lỗi crash map
  const activePolicies = Array.isArray(pricePolicyData) ? pricePolicyData : [];

  // 1. Mỗi khi mở Modal, đồng bộ số lượng hiện tại từ bảng Table chính vào Modal
  useEffect(() => {
    if (open) {
      const initialQuantities = {};
      (currentLineItems || []).forEach(item => {
        initialQuantities[item.id] = Number(item.qty_c || 0);
      });
      setSelectedQuantities(initialQuantities);
      setPage(1);
      fetchProductsFromAPI(1, '', false);
    }
  }, [open, currentLineItems]);

  // Tự động reload lại danh sách sản phẩm hiển thị giá mới mỗi khi đổi chính sách giá khách hàng ngoài UI
  useEffect(() => {
    if (open) {
      setPage(1);
      fetchProductsFromAPI(1, keyword, false);
    }
  }, [pricePolicyData]);

  // 2. Gọi API danh sách sản phẩm phân trang từ EntryPoint tổng quát
  const fetchProductsFromAPI = async (searchPage, searchKeyword, isLoadMore = false) => {
    if (fetching && !isLoadMore) return;
    setFetching(true);
    try {
      const url = `./index.php?entryPoint=get_products_search&module=AOS_Products&page=${searchPage}&limit=20&keyword=${encodeURIComponent(searchKeyword)}`;
      const response = await fetch(url, { method: 'GET' });
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setProducts(prev => isLoadMore ? [...prev, ...result.data] : result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.total_pages || 1);
        }
      } else {
        if (!isLoadMore) setProducts([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
    } finally {
      setFetching(false);
    }
  };

  // 3. Xử lý tìm kiếm Debounce chống nhiễu
  const handleSearch = (e) => {
    const val = e.target.value;
    setKeyword(val);
    setPage(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchProductsFromAPI(1, val.trim(), false);
    }, 400);
  };

  // 4. Xử lý cuộn đáy danh sách nạp thêm trang mới (Infinite Scroll)
  const handleScroll = (e) => {
    const { target } = e;
    if (Math.ceil(target.scrollTop + target.clientHeight) >= target.scrollHeight - 5) {
      if (!fetching && page < totalPages) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProductsFromAPI(nextPage, keyword, true);
      }
    }
  };

  // 5. Hàm thay đổi tăng giảm số lượng có check tồn kho khả dụng (qty_cansell)
  const changeQuantity = (product, amount) => {
    const pId = product.id;
    const currentQty = selectedQuantities[pId] || 0;
    const newQty = currentQty + amount;
    
    // Bốc lô hàng đầu tiên để check tồn khả dụng
    const shipments = product.shipment_data || [];
    const maxCanSell = shipments.length > 0 ? Number(shipments[0].qty_cansell || 0) : 0;

    if (newQty < 0) return;

    if (amount > 0 && maxCanSell <= 0) {
      message.error(`Sản phẩm [${product.name}] đã hết hàng khả dụng trong kho!`);
      return;
    }

    if (newQty > maxCanSell) {
      message.warning(`Lô mặc định của sản phẩm này chỉ còn tối đa ${maxCanSell} sản phẩm khả dụng!`);
      return;
    }

    setSelectedQuantities(prev => ({ ...prev, [pId]: newQty }));
  };

  // Tính tổng số lượng mặt hàng đã được bấm chọn
  const totalSelectedItems = Object.values(selectedQuantities).filter(qty => qty > 0).length;

  // 6. Nhấn nút "Chọn xong" -> Đổ ngược dữ liệu cấu trúc LineItem chuẩn về file Table chính
  const handleConfirmSelect = () => {
    const chosenProducts = products.filter(p => selectedQuantities[p.id] > 0);
    
    const formattedLineItems = chosenProducts.map(p => {
      const defaultShipment = p.shipment_data?.[0] || null;
      const qty = selectedQuantities[p.id];

      // 🔥 ĐỒNG BỘ GIÁ KHI ĐỔ VỀ TABLE CHÍNH: Kiểm tra chính sách để ép giá custom_price
      const matchedPolicy = activePolicies.length > 0 
        ? activePolicies.find(policy => policy.product_id === p.id) 
        : null;

      const finalPrice = matchedPolicy ? Number(matchedPolicy.custom_price) : Number(p.price || 0);

      return {
        id: p.id,
        name_sp_c: p.name || '',
        product_image_c: p.product_image || '',
        price_c: finalPrice, // Gán giá ưu đãi đặc thù hoặc giá gốc niêm yết
        _original_price_c: Number(p.price || 0), // Niêm phong đơn giá gốc để khôi phục khi đổi khách
        discount_sp_c: 0,
        discount_type_sp_c: 'direct',
        qty_c: qty,
        sgt_shipment_id_c: defaultShipment ? defaultShipment.id : '',
        shipment_data: defaultShipment,
        _all_shipments: p.shipment_data || [],
        origin_amount: finalPrice * qty // Tính lại thành tiền dòng dựa trên giá ưu đãi mới
      };
    });

    onConfirm(formattedLineItems);
    onClose();
  };

  return (
    <Modal
      title={<span style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>Chọn sản phẩm để bán hàng</span>}
      open={open}
      onCancel={onClose}
      width={700}
      centered 
      footer={[
        <div key="footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontWeight: 500, color: '#1677ff', fontSize: 14 }}>
            {totalSelectedItems > 0 ? `Bạn đã chọn ${totalSelectedItems} sản phẩm` : 'Chưa có sản phẩm nào được chọn'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={onClose} style={{ minWidth: 90 }}>Thoát</Button>
            <Button type="primary" onClick={handleConfirmSelect} style={{ minWidth: 110 }}>Chọn xong</Button>
          </div>
        </div>
      ]}
    >
      {/* Ô tìm kiếm sản phẩm phía trên */}
      <Input
        placeholder="Tìm kiếm sản phẩm theo tên, SKU, mã vạch..."
        prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />}
        value={keyword}
        onChange={handleSearch}
        size="large"
        style={{ marginBottom: 16, borderRadius: 6 }}
        allowClear
      />

      {/* Khung chứa danh sách cuộn vô hạn */}
      <div 
        onScroll={handleScroll}
        style={{ height: '450px', overflowY: 'auto', paddingRight: 4, border: '1px solid #f0f0f0', borderRadius: 6 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {products.map((item) => {
            const currentQty = selectedQuantities[item.id] || 0;
            const defaultShipment = item.shipment_data?.[0] || {};
            const qtyOnhand = defaultShipment.quantity_on_hand ?? 0;
            const qtyCansell = defaultShipment.qty_cansell ?? 0;

            // 🔥 DÒ CHÍNH SÁCH GIÁ HIỂN THỊ CHO TỪNG DÒNG MẶT HÀNG TRÊN MODAL
            const matchedPolicy = activePolicies.length > 0 
              ? activePolicies.find(p => p.product_id === item.id) 
              : null;

            return (
              <div 
                key={item.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 16px', 
                  borderBottom: '1px solid #f0f0f0' 
                }}
              >
                {/* PHẦN HIỂN THỊ AVATAR & THÔNG TIN SẢN PHẨM */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  {item.product_image ? (
                    <Avatar src={item.product_image} shape="square" size={48} style={{ border: '1px solid #e8e8e8', flexShrink: 0 }} />
                  ) : (
                    <Avatar shape="square" size={48} style={{ backgroundColor: '#f5f5f5', color: '#ccc', fontSize: 20, flexShrink: 0 }}>📦</Avatar>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontWeight: 500, color: '#262626', fontSize: 13, wordBreak: 'break-word' }}>{item.name}</span>
                      
                      {/* 🟢 HIỂN THỊ ĐƠN GIÁ THEO CHÍNH SÁCH GIÁ ĐẠI LÝ / KHÁCH HÀNG */}
                      {matchedPolicy ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
                          <span style={{ fontWeight: 600, color: '#ff4d4f', fontSize: 14, whiteSpace: 'nowrap' }}>
                            {Number(matchedPolicy.custom_price).toLocaleString()} đ
                          </span>
                          <span style={{ fontSize: 11, color: '#bfbfbf', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                            {Number(item.price || 0).toLocaleString()} đ
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#262626', fontSize: 14, whiteSpace: 'nowrap' }}>
                          {Number(item.price || 0).toLocaleString()} đ
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                      <span style={{ color: '#8c8c8c' }}>{item.part_number || item.sku || '---'} {item.maincode ? `| Mã: ${item.maincode}` : ''}</span>
                      <span style={{ color: '#595959' }}>
                        Tồn: <span style={{ color: '#1890ff', fontWeight: 500 }}>{qtyOnhand}</span> | Có thể bán: <span style={{ color: '#52c41a', fontWeight: 500 }}>{qtyCansell}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* BỘ ĐIỀU KHIỂN SỐ LƯỢNG SẢN PHẨM PHÍA BÊN PHẢI */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {currentQty > 0 ? (
                    <>
                      <Button 
                        type="text" 
                        icon={<MinusCircleOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />} 
                        onClick={() => changeQuantity(item, -1)}
                      />
                      <InputNumber
                        min={0}
                        size="small"
                        style={{ width: 50, textAlign: 'center' }}
                        controls={false}
                        value={currentQty}
                        onChange={(val) => setSelectedQuantities(prev => ({ ...prev, [item.id]: Number(val || 0) }))}
                      />
                      <Button 
                        type="text" 
                        icon={<PlusCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />} 
                        onClick={() => changeQuantity(item, 1)}
                      />
                    </>
                  ) : (
                    <Button 
                      type="text" 
                      icon={<PlusCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />} 
                      onClick={() => changeQuantity(item, 1)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CÁC THÀNH PHẦN PHỤ TRỢ LOADING / KHÔNG CÓ DATA */}
        {fetching && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Spin size="small" description="Đang tải danh sách sản phẩm..." />
          </div>
        )}
        {!fetching && products.length === 0 && (
          <Empty style={{ marginTop: 60 }} description="Không tìm thấy sản phẩm nào" />
        )}
      </div>
    </Modal>
  );
}
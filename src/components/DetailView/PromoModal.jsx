import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, Checkbox, Space, Typography, message, Row, Col, InputNumber, Spin, Empty, Tag } from 'antd';

import {
  SearchOutlined,
  CloseSquareFilled,
  ArrowLeftOutlined,
  GiftOutlined,
  PercentageOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function PromoModal({
  isOpen,
  onCancel,     // Callback đóng modal mặc định từ file cha
  onClose,      // Callback đóng dự phòng
  onApply,
  formData = {},
  lineItems = [],
  setLineItems  // Hàm cập nhật giỏ hàng từ file cha truyền sang
}) {
  const [loading, setLoading] = useState(false);
  const [promos, setPromos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [giftSearchTerm, setGiftSearchTerm] = useState('');
  const [selectedPromoIds, setSelectedPromoIds] = useState([]);
  const [activeGiftPromo, setActiveGiftPromo] = useState(null);
  const [tempGiftSelections, setTempGiftSelections] = useState({});

  // Điều hướng hàm đóng modal an toàn
  const handleClose = () => {
    if (typeof onCancel === 'function') onCancel();
    else if (typeof onClose === 'function') onClose();
  };

  /**
   * =========================================================
   * LOAD PROMOTIONS FROM API PROMOTION ENGINE
   * =========================================================
   */
  useEffect(() => {
    if (!isOpen) return;
    fetchPromotions();
  }, [isOpen]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);

      const payload = {
        header: {
          warehouse_id: formData?.warehouse_src_c?.id || formData?.warehouse_id || "",
          source: formData?.src_sell || formData?.source || "",
          order_date: formData?.order_date || "",
          group_customer_name: formData?.group_customer_name || ""
        },
        line_items: lineItems.map((item) => ({
          product_id: item.aos_products_id_c || item.product_id || "", 
          qty: Number(item.qty_c || item.qty || 0),
          subtotal: Number(item.subtotal_c || item.subtotal || 0)
        }))
      };

      const res = await fetch(
        "./index.php?entryPoint=promotion_engine",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const text = await res.text();

      if (!res.ok) {
        message.error(`HTTP ERROR ${res.status}`);
        return;
      }

      if (!text) {
        message.error("Response từ Promotion Engine rỗng");
        return;
      }

      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON PARSE ERROR", e);
        return;
      }

      if (!data.success) {
        message.error(data.message || "Không tải được danh sách CTKM");
        return;
      }

      setPromos(data.items || []);

    } catch (err) {
      console.error(err);
      message.error("Không kết nối được với Promotion Engine");
    } finally {
      setLoading(false);
    }
  };

  /**
   * =========================================================
   * BỘ LỌC TÌM KIẾM CTKM & QUÀ TẶNG
   * =========================================================
   */
  const filteredPromos = useMemo(() => {
    const kw = searchTerm.toLowerCase().trim();
    if (!kw) return promos;

    return promos.filter((p) =>
      (p.name || '').toLowerCase().includes(kw) ||
      (p.description || '').toLowerCase().includes(kw)
    );
  }, [searchTerm, promos]);

  const filteredGifts = useMemo(() => {
    if (!activeGiftPromo) return [];
    const kw = giftSearchTerm.toLowerCase().trim();
    if (!kw) return activeGiftPromo.gift_items || [];

    return (activeGiftPromo.gift_items || []).filter((g) =>
      (g.product_name || '').toLowerCase().includes(kw)
    );
  }, [giftSearchTerm, activeGiftPromo]);

  const totalSelectedGiftQty = useMemo(() => {
    return Object.values(tempGiftSelections).reduce((a, b) => a + b, 0);
  }, [tempGiftSelections]);

  const handleTogglePromo = (id) => {
    setSelectedPromoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPromoIds(filteredPromos.map((p) => p.id));
    } else {
      setSelectedPromoIds([]);
    }
  };

  /**
   * =========================================================
   * LOGIC XỬ LÝ CHỌN SỐ LƯỢNG QUÀ TẶNG KHUYẾN MÃI
   * =========================================================
   */
  const openGiftSelector = (promo) => {
    setActiveGiftPromo(promo);
    const initial = {};
    (promo.gift_items || []).forEach((g) => {
      initial[g.product_id] = g.qty || 0;
    });
    setTempGiftSelections(initial);
  };

  const handleGiftQtyChange = (productId, qty, maxQty) => {
    if (qty < 0) return;
    if (qty > maxQty) {
      message.warning(`Sản phẩm này trong kho khuyến mãi chỉ được tặng tối đa ${maxQty} cái`);
      return;
    }

    const clone = { ...tempGiftSelections, [productId]: qty };
    const total = Object.values(clone).reduce((a, b) => a + b, 0);

    if (total > (activeGiftPromo?.gift_max_qty || 0)) {
      message.warning(`Tổng số quà tặng vượt giới hạn định mức thiết lập (${activeGiftPromo?.gift_max_qty} quà)`);
      return;
    }
    setTempGiftSelections(clone);
  };

  const handleSaveGifts = () => {
    setPromos((prev) =>
      prev.map((p) => {
        if (p.id !== activeGiftPromo.id) return p;
        return {
          ...p,
          gift_items: p.gift_items.map((g) => ({
            ...g,
            qty: tempGiftSelections[g.product_id] || 0
          }))
        };
      })
    );

    if (totalSelectedGiftQty > 0 && !selectedPromoIds.includes(activeGiftPromo.id)) {
      setSelectedPromoIds((prev) => [...prev, activeGiftPromo.id]);
    }
    setActiveGiftPromo(null);
  };

  /**
   * ====================================================================
   * 🔥 ĐỘNG CƠ ÁP DỤNG: ĐẨY QUÀ VÀO GIỎ HÀNG CHÍNH (GIÁ = 0đ & TẠO KEY ĐA NĂNG)
   * ====================================================================
   */
  const handleApply = () => {
    const selected = promos.filter((p) => selectedPromoIds.includes(p.id));
    const newGiftsToInject = [];

    selected.forEach(promo => {
      if (promo.type === 'gift' && Array.isArray(promo.gift_items)) {
        promo.gift_items.forEach(gift => {
          const giftQty = Number(gift.qty || 0);
          
          if (giftQty > 0) {
            newGiftsToInject.push({
              // 🟢 CHÌA KHÓA: Tạo key tổng hợp độc lập bảo vệ AntD Table không nuốt dòng khi trùng mặt hàng mua
              tableRowKey: `${gift.product_id}_gift`, 
              aos_products_id_c: gift.product_id,
              name_sp_c: `(Quà tặng) ${gift.product_name}`, 
              product_image: gift.product_image || "",
              price_c: 0,            // Đơn giá quà tặng bằng 0đ
              discount_sp_c: 0,      // Chiết khấu quà tặng bằng 0
              discount_type_sp_c: 'direct',
              qty_c: giftQty,        
              subtotal_c: 0,         // Thành tiền bằng 0đ
              is_promo_gift: true,   // Đánh dấu nhận diện loại hàng khuyến mãi
              sgt_shipment_id_c: gift.sgt_shipment_id_c || "", 
              shipment_data: gift.shipment_data || null,
              _all_shipments: gift._all_shipments || []
            });
          }
        });
      }
    });

    // Bẫy kiểm tra an toàn: Đảm bảo file cha đã truyền prop setLineItems
    if (typeof setLineItems === 'function') {
      setLineItems(prev => {
        // Bước 1: Thanh trừng tháo gỡ sạch các mặt hàng quà tặng cũ đã chọn đợt trước ra khỏi giỏ
        const purchasedItemsOnly = prev.filter(item => !item.is_promo_gift);
        const combinedList = [...purchasedItemsOnly];
        
        // Bước 2: Nạp mảng quà tặng phẳng mới vào giỏ hàng
        newGiftsToInject.forEach(newGift => {
          const existGiftIndex = combinedList.findIndex(
            x => x.aos_products_id_c === newGift.aos_products_id_c && x.is_promo_gift
          );
          
          if (existGiftIndex !== -1) {
            // Nếu trùng khít quà tặng, tiến hành cộng dồn số lượng
            combinedList[existGiftIndex].qty_c += newGift.qty_c;
          } else {
            // Nếu chưa có, chèn dòng mới
            combinedList.push(newGift);
          }
        });

        return combinedList;
      });
    } else {
      console.error("❌ [LỖI ĐỒNG BỘ STATE]: Prop 'setLineItems' chưa được truyền vào cấu hình của <PromoModal /> ở file cha!");
    }

    // Bắn mảng CTKM được áp dụng về hàm xử lý hậu cần của file cha
    if (typeof onApply === 'function') {
      onApply(selected);
    }
  };

  const isAllSelected =
    filteredPromos.length > 0 &&
    filteredPromos.every((p) => selectedPromoIds.includes(p.id));

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={activeGiftPromo ? 1100 : 920}
      centered
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      {/* KHU VỰC HEADER MODAL */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
        {!activeGiftPromo ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Áp dụng CTKM</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#8c8c8c' }}>
              Tìm thấy {filteredPromos.length} CTKM phù hợp với giỏ hàng hiện tại
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ArrowLeftOutlined onClick={() => setActiveGiftPromo(null)} style={{ cursor: 'pointer', fontSize: 16 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Chọn danh mục quà tặng</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{activeGiftPromo?.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* MÀN HÌNH CHÍNH 1: DANH SÁCH CHƯƠNG TRÌNH KHUYẾN MÃI CO KHỚP */}
      {!activeGiftPromo ? (
        <div style={{ padding: 24 }}>
          {/* Ô TÌM KIẾM NHANH & CHECKBOX CHỌN TẤT CẢ */}
          <Row gutter={16} align="middle" style={{ marginBottom: 18 }}>
            <Col flex="auto">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm chương trình khuyến mãi theo tên hoặc mô tả..."
                prefix={<SearchOutlined />}
                allowClear
                style={{ height: 42, borderRadius: 8 }}
              />
            </Col>
            <Col>
              <Checkbox checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)}>
                Chọn tất cả
              </Checkbox>
            </Col>
          </Row>

          {/* DANH SÁCH LẶP CTKM */}
          <div style={{ maxHeight: 480, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4 }}>
            {loading ? (
              <div style={{ padding: '80px 0', textAlign: 'center' }}><Spin tip="Đang truy vấn Promotion Engine..." /></div>
            ) : filteredPromos.length === 0 ? (
              <Empty description="Không tìm thấy chương trình khuyến mãi nào phù hợp với điều kiện giỏ hàng" />
            ) : (
              filteredPromos.map((promo) => {
                const selected = selectedPromoIds.includes(promo.id);
                return (
                  <div
                    key={promo.id}
                    style={{
                      border: selected ? '1px solid #1677ff' : '1px solid #f0f0f0',
                      borderRadius: 12,
                      padding: 18,
                      marginBottom: 14,
                      background: selected ? '#f5f9ff' : '#fff',
                      transition: 'all .2s'
                    }}
                  >
                    <Row gutter={20} align="middle">
                      {/* THÔNG TIN CHI TIẾT CTKM */}
                      <Col span={16}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <Checkbox checked={selected} onChange={() => handleTogglePromo(promo.id)} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{promo.name}</div>
                              {promo.type === 'gift' ? (
                                <Tag color="gold" icon={<GiftOutlined />}>QUÀ TẶNG</Tag>
                              ) : (
                                <Tag color="blue" icon={<PercentageOutlined />}>GIẢM GIÁ</Tag>
                              )}
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#6b7280' }}>
                              {promo.description}
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* KHU VỰC HÀNH ĐỘNG/GIÁ TRỊ CỦA CTKM */}
                      <Col span={8} style={{ textAlign: 'right' }}>
                        {promo.type === 'gift' ? (
                          <Button type="primary" ghost onClick={() => openGiftSelector(promo)} style={{ borderRadius: 8 }}>
                            Chọn quà ({promo.gift_items?.reduce((acc, curr) => acc + (curr.qty || 0), 0) || 0})
                          </Button>
                        ) : (
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff' }}>
                            {promo.discount_value}
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                );
              })
            )}
          </div>

          {/* THANH ĐIỀU HƯỚNG BOTTOM MODAL */}
          <div style={{ marginTop: 20, borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontWeight: 500 }}>Đã chọn: <span style={{ color: '#1677ff' }}>{selectedPromoIds.length}</span> chiến dịch khuyến mãi</Text>
            <Space size={10}>
              <Button onClick={handleClose}>Đóng</Button>
              <Button danger onClick={() => { setSelectedPromoIds([]); if(typeof setLineItems === 'function') setLineItems(prev => prev.filter(x => !x.is_promo_gift)); onApply([]); }}>Dừng áp dụng</Button>
              <Button type="primary" onClick={handleApply} style={{ fontWeight: 500, padding: '0 20px' }}>Áp dụng</Button>
            </Space>
          </div>
        </div>
      ) : (
        /* MÀN HÌNH CHÍNH 2: KHÔNG GIAN LỰA CHỌN QUÀ TẶNG ĐI KÈM */
        <Row style={{ minHeight: 560 }}>
          {/* NỬA TRÁI: DANH SÁCH QUÀ TẶNG PHÙ HỢP CÓ THỂ CHỌN */}
          <Col span={15} style={{ borderRight: '1px solid #f0f0f0', padding: 24 }}>
            <Input
              placeholder="Nhập tên sản phẩm quà tặng cần tìm kiếm..."
              prefix={<SearchOutlined />}
              allowClear
              value={giftSearchTerm}
              onChange={(e) => setGiftSearchTerm(e.target.value)}
              style={{ marginBottom: 20, height: 42, borderRadius: 8 }}
            />
            <div style={{ maxHeight: 430, overflowY: 'auto' }}>
              {filteredGifts.map((gift) => {
                const qty = tempGiftSelections[gift.product_id] || 0;
                return (
                  <div
                    key={gift.product_id}
                    style={{
                      border: qty > 0 ? '1px solid #1677ff' : '1px solid #f0f0f0',
                      borderRadius: 10,
                      padding: 16,
                      marginBottom: 12,
                      background: qty > 0 ? '#f5f9ff' : '#fff'
                    }}
                  >
                    <Row gutter={16} align="middle">
                      <Col flex="auto">
                        <div style={{ fontWeight: 600, lineHeight: 1.6, color: '#1f2937' }}>{gift.product_name}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>Định mức tặng tối đa: <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{gift.max_qty}</span></div>
                      </Col>
                      <Col>
                        <InputNumber
                          min={0}
                          max={gift.max_qty}
                          value={qty}
                          style={{ borderRadius: '6px' }}
                          onChange={(val) => handleGiftQtyChange(gift.product_id, Number(val || 0), gift.max_qty)}
                        />
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </div>
          </Col>

          {/* NỬA PHẢI: GIỎ XEM TRƯỚC CÁC SẢN PHẨM QUÀ TẶNG ĐÃ CHỌN */}
          <Col span={9}>
            <div style={{ padding: 24, background: '#fafafa', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>Quà tặng đã chọn</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
                Tổng số lượng: <span style={{ fontWeight: 600, color: '#1677ff' }}>{totalSelectedGiftQty}</span> / {activeGiftPromo?.gift_max_qty} sản phẩm quà tặng quy đổi
              </div>

              <div style={{ flex: 1, maxHeight: 360, overflowY: 'auto' }}>
                {(activeGiftPromo?.gift_items || [])
                  .filter((g) => (tempGiftSelections[g.product_id] || 0) > 0)
                  .map((g) => (
                    <div key={g.product_id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 12, background: '#fff' }}>
                      <div style={{ fontWeight: 600, lineHeight: 1.5, color: '#374151' }}>{g.product_name}</div>
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontWeight: 500 }}>Số lượng nhận: {tempGiftSelections[g.product_id]}</Text>
                        <CloseSquareFilled
                          onClick={() => handleGiftQtyChange(g.product_id, 0, g.max_qty)}
                          style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 19 }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                <Button onClick={() => setActiveGiftPromo(null)}>Quay lại</Button>
                <Button type="primary" onClick={handleSaveGifts}>Xác nhận quà</Button>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </Modal>
  );
}
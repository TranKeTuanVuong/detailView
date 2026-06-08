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
  onClose,
  onApply,
  formData = {},
  lineItems = []
}) {
  const [loading, setLoading] = useState(false);
  const [promos, setPromos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [giftSearchTerm, setGiftSearchTerm] = useState('');
  const [selectedPromoIds, setSelectedPromoIds] = useState([]);
  const [activeGiftPromo, setActiveGiftPromo] = useState(null);
  const [tempGiftSelections, setTempGiftSelections] = useState({});

  /**
   * =========================================================
   * LOAD PROMOTIONS FROM API
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
        // 1. Sửa từ warehouse_id thành sgt_warehouse_id_c theo đúng log formData
        warehouse_id: formData?.warehouse_src_c.id  || formData?.warehouse_id || "",
        
        // 2. Sửa từ source thành src_sell theo đúng log formData
        source: formData?.src_sell || formData?.source || "",
        
        // 3. Giữ nguyên ngày tháng (đã ăn khớp "2026-06-06")
        order_date: formData?.order_date || "",
        
        // 4. Vì formData không có tên nhóm khách hàng, ta truyền tạm rỗng hoặc xử lý bổ sung nếu cần
        group_customer_name: formData?.group_customer_name || ""
      },
      
      // Khối line_items giữ nguyên cấu trúc chuẩn hóa đuôi _c lúc nãy
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const text = await res.text();

    if (!res.ok) {
      message.error(`HTTP ERROR ${res.status}`);
      return;
    }

    if (!text) {
      message.error("Response rỗng");
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
      message.error(data.message || "Không tải được CTKM");
      return;
    }

    setPromos(data.items || []);

  } catch (err) {
    console.error(err);
    message.error("Không kết nối được Promotion Engine");
  } finally {
    setLoading(false);
  }
};

  /**
   * =========================================================
   * FILTER PROMOS
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

  /**
   * =========================================================
   * FILTER GIFTS
   * =========================================================
   */
  const filteredGifts = useMemo(() => {
    if (!activeGiftPromo) return [];
    const kw = giftSearchTerm.toLowerCase().trim();
    if (!kw) return activeGiftPromo.gift_items || [];

    return (activeGiftPromo.gift_items || []).filter((g) =>
      (g.product_name || '').toLowerCase().includes(kw)
    );
  }, [giftSearchTerm, activeGiftPromo]);

  /**
   * =========================================================
   * TOTAL GIFT QTY
   * =========================================================
   */
  const totalSelectedGiftQty = useMemo(() => {
    return Object.values(tempGiftSelections).reduce((a, b) => a + b, 0);
  }, [tempGiftSelections]);

  /**
   * =========================================================
   * TOGGLE PROMO SELECT
   * =========================================================
   */
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
   * GIFT HANDLERS
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
      message.warning(`Tối đa ${maxQty} sản phẩm`);
      return;
    }

    const clone = { ...tempGiftSelections, [productId]: qty };
    const total = Object.values(clone).reduce((a, b) => a + b, 0);

    if (total > (activeGiftPromo?.gift_max_qty || 0)) {
      message.warning(`Chỉ được chọn tối đa ${activeGiftPromo?.gift_max_qty} quà`);
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
   * =========================================================
   * APPLY ACTIONS
   * =========================================================
   */
  const handleApply = () => {
    const selected = promos.filter((p) => selectedPromoIds.includes(p.id));
    onApply(selected);
  };

  const isAllSelected =
    filteredPromos.length > 0 &&
    filteredPromos.every((p) => selectedPromoIds.includes(p.id));

 return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={activeGiftPromo ? 1100 : 920}
      centered
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      {/* HEADER */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
        {!activeGiftPromo ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Áp dụng CTKM</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#8c8c8c' }}>
              Tìm thấy {filteredPromos.length} CTKM phù hợp
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ArrowLeftOutlined onClick={() => setActiveGiftPromo(null)} style={{ cursor: 'pointer', fontSize: 16 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Chọn quà tặng</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{activeGiftPromo?.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      {!activeGiftPromo ? (
        <div style={{ padding: 24 }}>
          {/* SEARCH & SELECT ALL */}
          <Row gutter={16} align="middle" style={{ marginBottom: 18 }}>
            <Col flex="auto">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm CTKM..."
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

          {/* PROMO LIST */}
          <div style={{ maxHeight: 480, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4 }}>
            {loading ? (
              <div style={{ padding: '80px 0', textAlign: 'center' }}><Spin /></div>
            ) : filteredPromos.length === 0 ? (
              <Empty description="Không có CTKM phù hợp" />
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
                    <Row gutter={20}>
                      {/* LEFT INFO */}
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

                      {/* RIGHT VALUE ACTION */}
                      <Col span={8} style={{ textAlign: 'right' }}>
                        {promo.type === 'gift' ? (
                          <Button type="primary" ghost onClick={() => openGiftSelector(promo)} style={{ borderRadius: 8 }}>
                            Chọn quà
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

          {/* FOOTER ACTIONS */}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">Đã chọn: {selectedPromoIds.length} CTKM</Text>
            <Space>
              <Button onClick={onClose}>Đóng</Button>
              <Button danger onClick={() => { setSelectedPromoIds([]); onApply([]); }}>Dừng áp dụng</Button>
              <Button type="primary" onClick={handleApply}>Áp dụng</Button>
            </Space>
          </div>
        </div>
      ) : (
        /* GIFT SELECTOR SCREEN */
        <Row style={{ minHeight: 560 }}>
          {/* LEFT GIFT ITEMS */}
          <Col span={15} style={{ borderRight: '1px solid #f0f0f0', padding: 24 }}>
            <Input
              placeholder="Tìm sản phẩm quà..."
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
                    <Row gutter={16}>
                      <Col flex="auto">
                        <div style={{ fontWeight: 600, lineHeight: 1.6 }}>{gift.product_name}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>Tối đa: {gift.max_qty}</div>
                      </Col>
                      <Col>
                        <InputNumber
                          min={0}
                          max={gift.max_qty}
                          value={qty}
                          onChange={(val) => handleGiftQtyChange(gift.product_id, Number(val || 0), gift.max_qty)}
                        />
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </div>
          </Col>

          {/* RIGHT SELECTED PREVIEW */}
          <Col span={9}>
            <div style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Quà đã chọn</div>
              <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 18 }}>
                Tổng: {totalSelectedGiftQty} / {activeGiftPromo?.gift_max_qty}
              </div>

              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {(activeGiftPromo?.gift_items || [])
                  .filter((g) => (tempGiftSelections[g.product_id] || 0) > 0)
                  .map((g) => (
                    <div key={g.product_id} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, lineHeight: 1.6 }}>{g.product_name}</div>
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary">SL: {tempGiftSelections[g.product_id]}</Text>
                        <CloseSquareFilled
                          onClick={() => handleGiftQtyChange(g.product_id, 0, g.max_qty)}
                          style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 18 }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button onClick={() => setActiveGiftPromo(null)}>Quay lại</Button>
                <Button type="primary" onClick={handleSaveGifts}>Áp dụng</Button>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </Modal>
  );
}
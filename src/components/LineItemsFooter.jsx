import React from 'react';
import { Row, Col, Input, Typography, Divider, InputNumber } from 'antd';

const { Text } = Typography;
const { TextArea } = Input;

export default function LineItemsFooter({ lineItems, formData, handleFormChange }) {
  
  // 1. Tự động tính toán tổng số tiền của tất cả sản phẩm trong giỏ hàng
  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.origin_amount || 0), 0);
  const totalQty = lineItems.reduce((sum, item) => sum + Number(item.qty_c || 0), 0);

  // 2. Lấy giá trị chiết khấu tổng, phí giao hàng, khách đã trả từ formData
  const totalDiscount = Number(formData.total_discount_c || 0);
  const shippingFee = Number(formData.shipping_fee_c || 0);
  const amountPaid = Number(formData.amount_paid_c || 0);

  // 3. Công thức tính số tiền Khách phải trả và Còn phải trả
  const finalPayment = totalAmount - totalDiscount + shippingFee;
  const remainingPayment = finalPayment - amountPaid;

  const labelStyle = { fontSize: 13, color: '#555' };
  const valueStyle = { fontSize: 14, fontWeight: 600, color: '#111' };

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #e8e8e8' }}>
      {/* THANH TÁC VỤ TIỆN ÍCH TRÊN CÙNG */}
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <span style={{ color: '#1677ff', cursor: 'pointer', fontWeight: 500 }}>
            ➕ Thêm dịch vụ khác (F9)
          </span>
        </Col>
        <Col>
          <span style={{ color: '#1677ff', cursor: 'pointer', fontWeight: 500 }}>
            🎁 Áp dụng chương trình khuyến mại
          </span>
        </Col>
      </Row>

      <Row gutter={32}>
        {/* KHỐI BÊN TRÁI - TAGS & GHI CHÚ */}
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
              Tags ℹ️
            </Text>
            <TextArea 
              rows={2} 
              placeholder="Nhập thẻ phân loại..." 
              value={formData.tags_c || ''}
              onChange={(e) => handleFormChange('tags_c', e.target.value)}
            />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
              Ghi chú đơn hàng
            </Text>
            <TextArea 
              rows={3} 
              placeholder="VD: Hàng tặng gói riêng" 
              value={formData.description || ''}
              onChange={(e) => handleFormChange('description', e.target.value)}
            />
          </div>
        </Col>

        {/* KHỐI BÊN PHẢI - BẢNG TÍNH TOÁN TIỀN TỆ */}
        <Col xs={24} md={12} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* Tổng tiền */}
          <Row justify="space-between" align="middle">
            <Text style={labelStyle}>Tổng tiền ({totalQty} sản phẩm)</Text>
            <Text style={valueStyle}>{totalAmount.toLocaleString()} đ</Text>
          </Row>

          {/* Chiết khấu đơn hàng */}
          <Row justify="space-between" align="middle">
            <Text style={labelStyle}>Chiết khấu (F6)</Text>
            <InputNumber
              size="small"
              variant="borderless" // 🔥 Đã fix chuẩn Antd v5
              style={{ textAlign: 'right', width: 120, fontWeight: 600, paddingRight: 0 }}
              value={totalDiscount === 0 ? null : totalDiscount}
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v.replace(/,/g, '')}
              onChange={(val) => handleFormChange('total_discount_c', val)}
            />
          </Row>

          {/* Phí giao hàng */}
          <Row justify="space-between" align="middle">
            <Text style={{ ...labelStyle, color: '#1677ff', cursor: 'pointer' }}>Phí giao hàng (F7)</Text>
            <InputNumber
              size="small"
              variant="borderless" // 🔥 Đã fix chuẩn Antd v5
              style={{ textAlign: 'right', width: 120, fontWeight: 600, paddingRight: 0 }}
              value={shippingFee === 0 ? null : shippingFee}
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v.replace(/,/g, '')}
              onChange={(val) => handleFormChange('shipping_fee_c', val)}
            />
          </Row>

          {/* Mã giảm giá */}
          <Row justify="space-between" align="middle">
            <Text style={{ ...labelStyle, color: '#1677ff', cursor: 'pointer' }}>Mã giảm giá 🔽</Text>
            <Text style={valueStyle}>0 đ</Text>
          </Row>

          {/* Khách phải trả */}
          <Row justify="space-between" align="middle" style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#000' }}>Khách phải trả</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
              {finalPayment > 0 ? finalPayment.toLocaleString() : 0} đ
            </Text>
          </Row>

          <Divider style={{ margin: '4px 0' }} />

          {/* Khách đã trả */}
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#000' }}>Khách đã trả</Text>
            <InputNumber
              size="small"
              variant="borderless" // 🔥 Đã fix chuẩn Antd v5
              style={{ textAlign: 'right', width: 150, fontSize: 15, fontWeight: 'bold', color: '#000', paddingRight: 0 }}
              value={amountPaid === 0 ? null : amountPaid}
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v.replace(/,/g, '')}
              onChange={(val) => handleFormChange('amount_paid_c', val)}
            />
          </Row>

          <Row justify="space-between" align="middle">
            <span style={{ color: '#1677ff', cursor: 'pointer', fontSize: 13 }}>
              🔵 Thêm phương thức
            </span>
          </Row>

          <Divider style={{ margin: '4px 0' }} />

          {/* Còn phải trả */}
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#000' }}>Còn phải trả</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: remainingPayment < 0 ? '#ff4d4f' : '#000' }}>
              {remainingPayment.toLocaleString()} đ
            </Text>
          </Row>

        </Col>
      </Row>
    </div>
  );
}
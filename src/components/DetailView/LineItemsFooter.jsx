import React from 'react';
import { Row, Col, Typography, Divider } from 'antd';

const { Text } = Typography;

export default function LineItemsFooter({ 
  lineItems = [], 
  formData = {}
}) {
  
  // 1. TÍNH TOÁN CÁC CHỈ SỐ LOGIC TĨNH TỪ DANH SÁCH BẢNG SẢN PHẨM HIỆN TẠI
  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.subtotal_c || 0), 0);
  const totalQty = lineItems.filter(item => !item.is_promo_gift).reduce((sum, item) => sum + Number(item.qty_c || 0), 0);
  const totalGiftQty = lineItems.filter(item => item.is_promo_gift).reduce((sum, item) => sum + Number(item.qty_c || 0), 0);

  // 2. ĐỌC GIÁ TRỊ TỔNG CHIẾT KHẤU ĐÃ LƯU TRÊN FORM CHA TỪ DB TRẢ VỀ
  const savedDiscountType = formData.discount_type_c || 'direct';
  const savedDiscountValue = Number(formData.total_discount_c || 0);
  const displayDiscountMoney = savedDiscountType === 'percent' 
    ? (totalAmount * savedDiscountValue) / 100 
    : savedDiscountValue;

  // 3. ĐỌC CÁC PHỤ PHÍ VÀ SỐ TIỀN THANH TOÁN THỰC TẾ DƯỚI DATABASE
  const shippingFee = Number(formData.shipping_fee_c || 0);
  const amountPaid = Number(formData.amount_paid_c || 0);

  // Công thức cộng trừ tiền tệ tĩnh để kết xuất ra giao diện báo cáo
  const finalPayment = totalAmount - displayDiscountMoney + shippingFee;
  const remainingPayment = finalPayment - amountPaid;

  const labelStyle = { fontSize: 13, color: '#555' };
  const valueStyle = { fontSize: 14, fontWeight: 600, color: '#111' };

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #e8e8e8' }}>
      <Row gutter={32}>
        {/* KHỐI BÊN TRÁI - HIỂN THỊ TAGS & GHI CHÚ ĐƠN HÀNG TĨNH TUYỆT ĐỐI */}
        <Col xs={24} md={12} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Tags phân loại ℹ️</Text>
            <div style={{ minHeight: '36px', padding: '6px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <Text style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                {formData.tags_c || '---'}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Ghi chú đơn hàng</Text>
            <div style={{ minHeight: '64px', padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <Text style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap' }}>
                {formData.description || 'Không có ghi chú nào cho đơn hàng này.'}
              </Text>
            </div>
          </div>
        </Col>

        {/* KHỐI BÊN PHẢI - BẢNG KẾT XUẤT TIỀN TỆ ĐƠN HÀNG READ-ONLY */}
        <Col xs={24} md={12} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* Tổng tiền hàng */}
          <Row justify="space-between" align="middle">
            <Text style={labelStyle}>Tổng tiền hàng ({totalQty} sản phẩm)</Text>
            <Text style={valueStyle}>{totalAmount.toLocaleString()} đ</Text>
          </Row>

          {/* Chiết khấu tổng đơn hàng tĩnh (Khóa text không kích hoạt click mở modal) */}
          <Row justify="space-between" align="middle">
            <Text style={labelStyle}>
              Chiết khấu tổng đơn {savedDiscountType === 'percent' ? `(${savedDiscountValue}%)` : ''}
            </Text>
            <Text style={{ ...valueStyle, color: '#ff4d4f' }}>
              {displayDiscountMoney > 0 ? `- ${displayDiscountMoney.toLocaleString()}` : '0'} đ
            </Text>
          </Row>

          {/* Hàng quà tặng khuyến mại kèm theo đơn nếu phát hiện có tồn tại */}
          {totalGiftQty > 0 && (
            <Row justify="space-between" align="middle" style={{ background: '#f0fdf4', padding: '6px 10px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
              <Text style={{ ...labelStyle, color: '#16a34a', fontWeight: 500 }}>🎁 Quà tặng KM kèm theo:</Text>
              <Text style={{ ...valueStyle, color: '#16a34a' }}>{totalGiftQty} sản phẩm (0 đ)</Text>
            </Row>
          )}

          {/* Phí giao hàng dạng tĩnh */}
          <Row justify="space-between" align="middle">
            <Text style={labelStyle}>Phí giao hàng</Text>
            <Text style={valueStyle}>{shippingFee.toLocaleString()} đ</Text>
          </Row>

          {/* Mã giảm giá mặc định */}
          <Row justify="space-between" align="middle">
            <Text style={labelStyle}>Mã giảm giá</Text>
            <Text style={valueStyle}>0 đ</Text>
          </Row>

          {/* Khách phải trả tổng kết */}
          <Row justify="space-between" align="middle" style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>Khách phải trả</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0088FF' }}>
              {finalPayment > 0 ? finalPayment.toLocaleString() : 0} đ
            </Text>
          </Row>

          <Divider style={{ margin: '4px 0' }} />

          {/* Khách đã trả dạng tĩnh */}
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>Khách đã trả</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
              {amountPaid.toLocaleString()} đ
            </Text>
          </Row>

          <Divider style={{ margin: '4px 0' }} />

          {/* Dư nợ còn phải trả */}
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>Còn phải trả</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: remainingPayment < 0 ? '#ff4d4f' : '#334155' }}>
              {remainingPayment.toLocaleString()} đ
            </Text>
          </Row>
        </Col>
      </Row>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Typography, Divider, InputNumber, Modal, Select, Button, message } from 'antd';
const { Text } = Typography;
const { TextArea } = Input;
import PromoModal from './PromoModal'; // Nhớ check lại đường dẫn đúng tới file PromoModal.jsx
import { GiftOutlined } from '@ant-design/icons';

export default function LineItemsFooter({ lineItems, formData, handleFormChange, isPromoOpen, setIsPromoOpen, appliedPromos, handleApplyPromos }) {
  
  // --- 1. CÁC STATE QUẢN LÝ MODAL CHIẾT KHẤU NỘI BỘ ---
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState('direct'); // 'direct' hoặc 'percent'
  const [discountValue, setDiscountValue] = useState(0);

  // 2. Tính toán tổng số tiền gốc của các sản phẩm trong giỏ hàng
  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.subtotal_c || 0), 0);
  const totalQty = lineItems.reduce((sum, item) => sum + Number(item.qty_c || 0), 0);

  // Đồng bộ dữ liệu cũ từ formData lên Modal khi người dùng mở lại Modal
  useEffect(() => {
    if (discountModalOpen) {
      setDiscountType(formData.discount_type_c || 'direct');
      setDiscountValue(Number(formData.total_discount_c || 0));
    }
  }, [discountModalOpen, formData]);

  // --- 3. ĐỘNG CƠ TÍNH TOÁN GIÁ TRỊ CHIẾT KHẤU THỰC TẾ (HIỂN THỊ RA TIỀN) ---
  const getCalculatedDiscountMoney = () => {
    // Nếu chọn kiểu giảm theo %, tính số tiền tương ứng dựa trên tổng tiền đơn hàng
    if (discountType === 'percent') {
      return (totalAmount * Number(discountValue || 0)) / 100;
    }
    // Nếu chọn giảm tiền mặt trực tiếp
    return Number(discountValue || 0);
  };

  // Giá trị hiển thị ở ngoài màn hình Footer (đọc trực tiếp từ Form data của cha)
  const savedDiscountType = formData.discount_type_c || 'direct';
  const savedDiscountValue = Number(formData.total_discount_c || 0);
  const displayDiscountMoney = savedDiscountType === 'percent' 
    ? (totalAmount * savedDiscountValue) / 100 
    : savedDiscountValue;

  const shippingFee = Number(formData.shipping_fee_c || 0);
  const amountPaid = Number(formData.amount_paid_c || 0);

  // Tính số tiền Khách phải trả sau khi đã trừ chiết khấu vừa thiết lập
  const finalPayment = totalAmount - displayDiscountMoney + shippingFee;
  const remainingPayment = finalPayment - amountPaid;

  const labelStyle = { fontSize: 13, color: '#555' };
  const valueStyle = { fontSize: 14, fontWeight: 600, color: '#111' };

  // --- 4. XỬ LÝ KHI BẤM NÚT XÁC NHẬN TRÊN MODAL ---
  const handleConfirmDiscount = () => {
    if (discountType === 'direct' && discountValue > totalAmount) {
      message.error('Số tiền chiết khấu không được vượt quá tổng tiền đơn hàng!');
      return;
    }
    
    // Đẩy đồng thời 2 giá trị lên form cha của SuiteCRM
    handleFormChange('discount_type_c', discountType);
    handleFormChange('total_discount_c', discountValue);
    
    setDiscountModalOpen(false);
    message.success('Thiết lập chiết khấu đơn hàng thành công!');
  };

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #e8e8e8' }}>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <span style={{ color: '#1677ff', cursor: 'pointer', fontWeight: 500 }}>
            ➕ Thêm dịch vụ khác
          </span>
        </Col>
        <Col>
  <Button 
    type="link" 
    icon={<GiftOutlined />} 
    onClick={() => setIsPromoOpen(true)}
    style={{ fontWeight: 500, padding: 0, height: 'auto' }}
  >
    Áp dụng chương trình khuyến mại
  </Button>
  
  <PromoModal 
    isOpen={isPromoOpen} 
    onClose={() => setIsPromoOpen(false)} 
    onApply={handleApplyPromos} 
    lineItems={lineItems}
    formData={formData}
  />
</Col>
      </Row>

      <Row gutter={32}>
        {/* KHỐI BÊN TRÁI - TAGS & GHI CHÚ */}
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 12 }}>
            <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>Tags ℹ️</Text>
            <TextArea rows={2} placeholder="Nhập thẻ phân loại..." value={formData.tags_c || ''} onChange={(e) => handleFormChange('tags_c', e.target.value)} />
          </div>
          <div>
            <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>Ghi chú đơn hàng</Text>
            <TextArea rows={3} placeholder="VD: Hàng tặng gói riêng" value={formData.description || ''} onChange={(e) => handleFormChange('description', e.target.value)} />
          </div>
        </Col>

        {/* KHỐI BÊN PHẢI - BẢNG TÍNH TOÁN TIỀN TỆ */}
        <Col xs={24} md={12} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          {/* Tổng tiền */}
          <Row justify="space-between" align="middle">
            <Text style={labelStyle}>Tổng tiền ({totalQty} sản phẩm)</Text>
            <Text style={valueStyle}>{totalAmount.toLocaleString()} đ</Text>
          </Row>

          {/* Chiết khấu đơn hàng (Bấm vào chữ hoặc số đều mở Modal) */}
          <Row justify="space-between" align="middle">
            <Text 
              style={{ ...labelStyle, color: '#1677ff', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setDiscountModalOpen(true)}
            >
              Chiết khấu {savedDiscountType === 'percent' ? `(${savedDiscountValue}%)` : ''} 📝
            </Text>
            <Text 
              style={{ ...valueStyle, color: '#ff4d4f', cursor: 'pointer' }}
              onClick={() => setDiscountModalOpen(true)}
            >
              {displayDiscountMoney > 0 ? `- ${displayDiscountMoney.toLocaleString()}` : '0'} đ
            </Text>
          </Row>

          {/* Phí giao hàng */}
          <Row justify="space-between" align="middle">
            <Text style={{ ...labelStyle, color: '#1677ff', cursor: 'pointer' }}>Phí giao hàng</Text>
            <InputNumber
              size="small"
              variant="borderless"
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
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1677ff' }}>
              {finalPayment > 0 ? finalPayment.toLocaleString() : 0} đ
            </Text>
          </Row>

          <Divider style={{ margin: '4px 0' }} />

          {/* Khách đã trả */}
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#000' }}>Khách đã trả</Text>
            <InputNumber
              size="small"
              variant="borderless"
              style={{ textAlign: 'right', width: 150, fontSize: 15, fontWeight: 'bold', color: '#000', paddingRight: 0 }}
              value={amountPaid === 0 ? null : amountPaid}
              placeholder="0"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v.replace(/,/g, '')}
              onChange={(val) => handleFormChange('amount_paid_c', val)}
            />
          </Row>

          <Row justify="space-between" align="middle">
            <span style={{ color: '#1677ff', cursor: 'pointer', fontSize: 13 }}>🔵 Thêm phương thức</span>
          </Row>

          <Divider style={{ margin: '4px 0' }} />

          {/* Còn phải trả */}
          <Row justify="space-between" align="middle">
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#000' }}>Còn phải trả</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: remainingPayment < 0 ? '#ff4d4f' : '#262626' }}>
              {remainingPayment.toLocaleString()} đ
            </Text>
          </Row>
        </Col>
      </Row>

      {/* ========================================================================= */}
      {/* 🔥 CẤU TRÚC MODAL CHIẾT KHẤU ĐƯỢC CHỈNH SỬA TOÀN DIỆN CHUẨN ĐẸP CỦA BẠN */}
      {/* ========================================================================= */}
      <Modal
        title={<span style={{ fontWeight: 600 }}>Thiết lập chiết khấu đơn hàng</span>}
        open={discountModalOpen}
        onCancel={() => setDiscountModalOpen(false)}
        footer={null}
        width={380}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
          
          {/* Chọn kiểu chiết khấu */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Kiểu chiết khấu</Text>
            <Select
              value={discountType}
              style={{ width: '100%' }}
              onChange={(value) => {
                setDiscountType(value);
                setDiscountValue(0); // Reset về 0 tránh lỗi tính toán vượt ngưỡng
              }}
              options={[
                { label: 'Chiết khấu bằng tiền mặt (đ)', value: 'direct' },
                { label: 'Chiết khấu theo phần trăm (%)', value: 'percent' }
              ]}
            />
          </div>

          {/* Ô nhập giá trị */}
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Giá trị chiết khấu</Text>
            <InputNumber
              style={{ width: '100%' }}
              value={discountValue === 0 ? null : discountValue}
              min={0}
              placeholder={discountType === 'percent' ? 'Nhập % (Ví dụ: 10)' : 'Nhập số tiền mặt giảm...'}
              formatter={(value) => discountType === 'direct' ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : value}
              parser={(value) => (value || '').replace(/,/g, '')}
              onChange={(value) => {
                if (discountType === 'percent' && Number(value || 0) > 100) {
                  message.error('Chiết khấu phần trăm không được vượt quá 100%!');
                  return;
                }
                setDiscountValue(value || 0);
              }}
            />
          </div>

          {/* 🔥 HIỂN THỊ ĐỘNG SỐ TIỀN ĐƯỢC GIẢM KHI NGƯỜI DÙNG ĐANG GÕ THAY ĐỔI TRONG MODAL */}
          <div style={{ backgroundColor: '#f5f5f5', padding: '10px 12px', borderRadius: 6 }}>
            <Row justify="space-between">
              <Text style={{ fontSize: 13, color: '#666' }}>Giá trị quy đổi thành tiền mặt:</Text>
              <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>
                {getCalculatedDiscountMoney().toLocaleString()} đ
              </Text>
            </Row>
          </div>

          {/* Nút tác vụ xác nhận */}
          <Button
            type="primary"
            block
            size="large"
            style={{ backgroundColor: '#0088FF', borderColor: '#0088FF', fontWeight: 600, marginTop: 4 }}
            onClick={handleConfirmDiscount}
          >
            XÁC NHẬN
          </Button>
        </div>
      </Modal>
    </div>
  );
}
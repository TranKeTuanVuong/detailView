import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Typography, Divider, InputNumber, Modal, Select, Button, message } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import PromoModal from './PromoModal';

const { Text } = Typography;
const { TextArea } = Input;

export default function LineItemsFooter({ 
  lineItems = [], 
  setLineItems, 
  formData = {}, 
  handleFormChange, 
  isPromoOpen, 
  setIsPromoOpen, 
  appliedPromos = [], // Mảng danh sách chiến dịch KM đang áp dụng
  handleApplyPromos 
}) {
  
  // --- 1. CÁC STATE QUẢN LÝ MODAL CHIẾT KHẤU NỘI BỘ ---
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState('direct'); 
  const [discountValue, setDiscountValue] = useState(0);

  // Tính toán tổng số tiền gốc của sản phẩm mua (Loại trừ hàng quà tặng giá 0đ ra)
  const totalAmount = lineItems.reduce((sum, item) => sum + Number(item.subtotal_c || 0), 0);
  const totalQty = lineItems.filter(item => !item.is_promo_gift).reduce((sum, item) => sum + Number(item.qty_c || 0), 0);
  const totalGiftQty = lineItems.filter(item => item.is_promo_gift).reduce((sum, item) => sum + Number(item.qty_c || 0), 0);

  // ====================================================================
  // 🟢 ĐỘNG CƠ ĐỒNG BỘ CTKM: TỰ ĐỘNG BẮT ĐỂ CẬP NHẬT HOẶC XÓA SẠCH CHIẾT KHẤU
  // ====================================================================
  useEffect(() => {
    if (Array.isArray(appliedPromos) && appliedPromos.length > 0) {
      // Tìm chiến dịch khuyến mãi dạng giảm phần trăm tổng đơn hàng từ Engine trả về
      const percentPromo = appliedPromos.find(
        (p) => p.type === 'discount' || String(p.discount_value).includes('%')
      );

      if (percentPromo) {
        // Trích xuất số từ chuỗi (Ví dụ: "10%" hoặc số 10)
        const numericValue = parseFloat(String(percentPromo.discount_value).replace(/[^0-9.]/g, ''));
        
        if (!isNaN(numericValue) && numericValue > 0) {
          // Tự động đẩy dữ liệu chiết khấu phần trăm của CTKM lên Form chính hóa đơn của SuiteCRM
          handleFormChange('discount_type_c', 'percent');
          handleFormChange('total_discount_c', numericValue);
        }
      }
    } else {
      // 🌟 KHỐI FIX TRONG TÂM: Khi bấm "Ngừng áp dụng", appliedPromos trả về mảng rỗng []
      // Tiến hành kiểm tra nếu loại hình chiết khấu hiện tại đang là do KM đẩy lên (ví dụ: percent), tự động giải phóng về 0
      if (formData.discount_type_c === 'percent' || Number(formData.total_discount_c) > 0) {
        handleFormChange('discount_type_c', 'direct');
        handleFormChange('total_discount_c', 0);
      }
    }
  }, [appliedPromos]);

  // Đồng bộ dữ liệu cũ từ formData lên Modal khi người dùng mở lại Modal nhập tay
  useEffect(() => {
    if (discountModalOpen) {
      setDiscountType(formData.discount_type_c || 'direct');
      setDiscountValue(Number(formData.total_discount_c || 0));
    }
  }, [discountModalOpen, formData]);

  // --- 3. ĐỘNG CƠ TÍNH TOÁN GIÁ TRỊ CHIẾT KHẤU THỰC TẾ (HIỂN THỊ RA TIỀN) ---
  const getCalculatedDiscountMoney = () => {
    if (discountType === 'percent') {
      return (totalAmount * Number(discountValue || 0)) / 100;
    }
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

  // --- 4. XỬ LÝ KHI BẤM NÚT XÁC NHẬN TRÊN MODAL NHẬP TAY ---
  const handleConfirmDiscount = () => {
    if (discountType === 'direct' && discountValue > totalAmount) {
      message.error('Số tiền chiết khấu không được vượt quá tổng tiền đơn hàng!');
      return;
    }
    
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
            onCancel={() => setIsPromoOpen(false)} 
            onApply={handleApplyPromos} 
            lineItems={lineItems}
            setLineItems={setLineItems}
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
            <Text style={labelStyle}>Tổng tiền hàng ({totalQty} sản phẩm)</Text>
            <Text style={valueStyle}>{totalAmount.toLocaleString()} đ</Text>
          </Row>

          {/* Chiết khấu đơn hàng */}
          <Row justify="space-between" align="middle">
            <Text 
              style={{ ...labelStyle, color: '#1677ff', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setDiscountModalOpen(true)}
            >
              Chiết khấu tổng đơn {savedDiscountType === 'percent' ? `(${savedDiscountValue}%)` : ''} 📝
            </Text>
            <Text 
              style={{ ...valueStyle, color: '#ff4d4f', cursor: 'pointer' }}
              onClick={() => setDiscountModalOpen(true)}
            >
              {displayDiscountMoney > 0 ? `- ${displayDiscountMoney.toLocaleString()}` : '0'} đ
            </Text>
          </Row>

          {/* Hàng quà tặng kèm theo đơn nếu có */}
          {totalGiftQty > 0 && (
            <Row justify="space-between" align="middle" style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
              <Text style={{ ...labelStyle, color: '#52c41a', fontWeight: 500 }}>🎁 Sản phẩm quà tặng đi kèm:</Text>
              <Text style={{ ...valueStyle, color: '#52c41a' }}>{totalGiftQty} sản phẩm (0 đ)</Text>
            </Row>
          )}

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
              onChange={(val) => handleFormChange('shipping_fee_c', val || 0)}
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
              onChange={(val) => handleFormChange('amount_paid_c', val || 0)}
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

      {/* MODAL CONFIG CHIẾT KHẤU ĐƠN HÀNG CHỦ ĐỘNG */}
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
                setDiscountValue(0); 
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

          {/* Hiển thị quy đổi động */}
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
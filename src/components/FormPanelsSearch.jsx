import React, { useState } from 'react';
import { Card, Row, Col, Typography, Select, Empty, Checkbox, Divider } from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  PlusCircleOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

export default function FormPanelsSearch({ allPanels, formData, handleFormChange, cleanSystemLabel, RenderField }) {
  
  // State giả lập khách hàng hiện tại (Trong thực tế bạn sẽ lấy từ formData.customer_id)
  const [selectedCus, setSelectedCus] = useState(null);

  // Dữ liệu khách hàng mẫu (Sau này bạn fetch từ API)
  const customerOptions = [
    { value: 'cus_01', label: 'Nguyễn Văn A', phone: '0931234567', address: '123 Nguyễn Trãi, Quận 1, TP.HCM' },
    { value: 'cus_02', label: 'Trần Thị B', phone: '0909876543', address: '456 Lê Lợi, Quận Hải Châu, Đà Nẵng' },
    { value: 'cus_03', label: 'Lê Văn C', phone: '0385556667', address: '789 Giải Phóng, Quận Hai Bà Trưng, Hà Nội' },
  ];

  const handleSelectCustomer = (value, option) => {
    setSelectedCus(option);
    handleFormChange('customer_id', value);
    if (option.address) handleFormChange('billing_address_street', option.address);
  };

  // Vẽ phần header của Dropdown (Nút thêm mới)
  const renderDropdownHeader = (menu) => (
    <div>
      <div 
        style={{ 
          padding: '10px 12px', 
          color: '#1677ff', 
          cursor: 'pointer', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #f0f0f0'
        }}
        onMouseDown={(e) => e.preventDefault()} // Ngăn mất focus ô search
        onClick={() => alert('Mở modal thêm khách hàng mới')}
      >
        <PlusCircleOutlined style={{ fontSize: 18 }} /> Thêm mới khách hàng
      </div>
      {menu}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {allPanels.map((panel) => {
        // Kiểm tra xem có phải Panel khách hàng không (dựa vào key hoặc label từ SuiteCRM)
        const isCustomerPanel = panel.key.toLowerCase().includes('customer') || 
                               panel.label.toLowerCase().includes('khách');

        if (isCustomerPanel) {
          return (
            <Card
              key={panel.key}
              title={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                  <Col>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Thông tin khách hàng</span>
                  </Col>
                  <Col>
                    <Checkbox 
                      checked={formData.is_invoice === 1}
                      onChange={(e) => handleFormChange('is_invoice', e.target.checked ? 1 : 0)}
                    >
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#555' }}>
                        PHÁT HÀNH HOÁ ĐƠN ĐIỆN TỬ ℹ️
                      </span>
                    </Checkbox>
                  </Col>
                </Row>
              }
              className="card"
              // 🔥 FLEX: Ép Card cao full bằng bên Tab
              style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}
              styles={{ body: { padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' } }}
            >
              {/* Ô TÌM KIẾM DẠNG DROPDOWN */}
              <div style={{ marginBottom: 20 }}>
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Tìm theo tên, SĐT, mã khách hàng ..."
                  optionFilterProp="children"
                  value={selectedCus?.value || null}
                  onChange={handleSelectCustomer}
                  popupRender={renderDropdownHeader}   // ✅ FIX
                  suffixIcon={<SearchOutlined style={{ fontSize: 18, color: '#bfbfbf' }} />}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                    (option?.phone ?? '').includes(input)
                  }
                >
                  {customerOptions.map((cus) => (
                    <Select.Option key={cus.value} value={cus.value} label={cus.label} phone={cus.phone} address={cus.address}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#e6f4ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <UserOutlined style={{ color: '#1677ff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Text strong style={{ fontSize: 14 }}>{cus.label}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{cus.phone}</Text>
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* KHU VỰC HIỂN THỊ NỘI DUNG (CĂN GIỮA KHI TRỐNG) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {!selectedCus ? (
                  /* TRẠNG THÁI 1: CHƯA CHỌN KHÁCH */
                  <Empty
                    styles={{
                      image: { height: 60, opacity: 0.5 }
                    }}
                  />        
                ) : (
                  /* TRẠNG THÁI 2: ĐÃ CHỌN KHÁCH (HIỆN CHI TIẾT) */
                  <div style={{ animation: 'fadeIn 0.3s' }}>
                    <Row gutter={[24, 16]}>
                      <Col span={12}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <UserOutlined style={{ color: '#8c8c8c' }} />
                            <Text type="secondary">Tên khách:</Text>
                            <Text strong>{selectedCus.label}</Text>
                         </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PhoneOutlined style={{ color: '#8c8c8c' }} />
                            <Text type="secondary">Số điện thoại:</Text>
                            <Text strong>{selectedCus.phone}</Text>
                         </div>
                      </Col>
                      <Col span={24}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <EnvironmentOutlined style={{ color: '#8c8c8c', marginTop: 4 }} />
                            <Text type="secondary">Địa chỉ:</Text>
                            <Text style={{ flex: 1 }}>{selectedCus.address}</Text>
                         </div>
                      </Col>
                    </Row>
                    <Divider dashed style={{ margin: '16px 0' }} />
                    <div style={{ textAlign: 'right' }}>
                       <Text 
                        style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13 }} 
                        onClick={() => setSelectedCus(null)}
                       >
                         ✕ Bỏ chọn khách hàng
                       </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        }

        // --- RENDER CÁC PANEL KHÁC (GIỮ NGUYÊN LOGIC CŨ CỦA BẠN) ---
        const rows = {};
        (panel.fields || []).forEach((f) => {
          if (!rows[f.row]) rows[f.row] = [];
          rows[f.row].push(f);
        });

        return (
          <Card
            key={panel.key}
            title={<span className="panel-title-bold">{cleanSystemLabel(panel.label)}</span>}
            className="card"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}
            styles={{ body: { padding: '24px 16px 12px 16px', flex: 1 } }}
          >
            {Object.keys(rows).map((rowKey) => (
              <Row gutter={24} key={rowKey} style={{ marginBottom: 14 }}>
                {rows[rowKey]
                  .sort((a, b) => a.col - b.col)
                  .map((field) => (
                    <Col key={field.name} xs={24} md={rows[rowKey].length > 1 ? 24 / rows[rowKey].length : 12}>
                      <Row gutter={8} align="middle">
                        <Col span={8} style={{ textAlign: 'right', paddingRight: '6px' }}>
                          {!field.hide_label && field.type !== 'bool' && (
                            <Text style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
                              {cleanSystemLabel(field.label)}:
                            </Text>
                          )}
                        </Col>
                        <Col span={field.hide_label || field.type === 'bool' ? 24 : 16}>
                          <RenderField 
                            field={field} 
                            value={formData[field.name]} 
                            onChange={(newVal) => handleFormChange(field.name, newVal)} 
                          />
                        </Col>
                      </Row>
                    </Col>
                  ))}
              </Row>
            ))}
          </Card>
        );
      })}
    </div>
  );
}
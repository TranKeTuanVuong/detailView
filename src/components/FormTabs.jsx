import React from 'react';
import { Card, Row, Col, Typography } from 'antd';

const { Text } = Typography;

export default function FormTabs({ allTabs, formData, handleFormChange, cleanSystemLabel, RenderField,setWarehouseId , moduleName, setPromoType, setPromoMethod }) {
  if (!allTabs || allTabs.length === 0) return null;

  return (
    <div 
      className="tabs-to-cards-container" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',          // Khoảng cách giữa các khối Card xếp chồng lên nhau
        width: '100%' 
      }}
    >
      {/* 🔥 VÒNG LẶP: Mỗi phần tử Tab trong mảng allTabs sẽ được render thành 1 Card riêng biệt */}
      {allTabs.map((tab) => {
        // Định format lại tiêu đề hiển thị: Nếu là key 'default' thì đổi thành 'Thông tin chung', ngược lại dùng label hệ thống
        const cardTitle = tab.label === 'default' ? `Thông tin ${moduleName}` : cleanSystemLabel(tab.label);

        return (
          <Card
            key={tab.key}
            title={<span style={{ fontWeight: 600, fontSize: 14 }}>{cardTitle}</span>}
            className="custom-erp-card"
            style={{ 
              width: '100%',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
            }}
            styles={{ body: { padding: '16px 12px' } }}
          >
            {/* Nội dung bên trong của từng Card (Danh sách các fields thuộc Tab đó) */}
            <div 
              className="card-fields-area"
              style={{
                // Khống chế nếu Card nào có quá nhiều trường (fields) thì tự sinh cuộn dọc nội bộ
                maxHeight: '260px', 
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              {(tab.fields || []).map((field) => (
                <Row key={field.name} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                  {/* Cột hiển thị Nhãn (Label) */}
                  <Col span={9}>
                    {field.type !== 'bool' && !field.hide_label ? (
                      <Text 
                        style={{ fontSize: 13, color: '#555', fontWeight: 500 }} 
                        ellipsis={{ tooltip: cleanSystemLabel(field.label) }}
                      >
                        {cleanSystemLabel(field.label)}
                      </Text>
                    ) : <div />}
                  </Col>

                  {/* Cột hiển thị Ô nhập liệu (Input/Select...) */}
                  <Col span={15}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ color: '#bfbfbf', marginRight: 4 }}>:</span>
                      <div style={{ flex: 1 }}>
                        <RenderField
                          field={field}
                          value={formData[field.name]}
                          onChange={(newVal) => {
                            handleFormChange(field.name, newVal);
                            if (field.name === 'warehouse_src_c') {
                              setWarehouseId(newVal.id || null); // Cập nhật warehouseId khi trường kho hàng thay đổi
                            } else if (field.name === 'promo_type') {
                              setPromoType(newVal || null);
                            } else if (field.name === 'methods') {
                              setPromoMethod(newVal || null);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </Col>
                </Row>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
import React from 'react';
import { Card, Tabs, Row, Col, Typography } from 'antd';

const { Text } = Typography;

export default function FormTabs({ allTabs, formData, handleFormChange, cleanSystemLabel, RenderField }) {
  if (!allTabs || allTabs.length === 0) return null;

  const tabItems = allTabs.map((tab) => ({
    key: tab.key,
    label: tab.key === 'default' ? 'Thông tin đơn hàng' : cleanSystemLabel(tab.label),
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 🔥 Khống chế nội dung vừa khít 5 fields đầu, còn lại tự cuộn */}
        <div 
          className="tab-scroll-area" 
          style={{ 
            padding: '16px 12px 0 12px',
            height: '240px',       // Chiều cao lý tưởng cho đúng 5 hàng fields
            overflowY: 'auto',     // Tự động xuất hiện thanh cuộn dọc khi nhiều hơn 5 fields
            overflowX: 'hidden'
          }}
        >
          {(tab.fields || []).map((field) => (
            <Row key={field.name} gutter={12} align="middle" style={{ marginBottom: 14 }}>
              <Col span={9}>
                {field.type !== 'bool' && !field.hide_label ? (
                  <Text style={{ fontSize: 13, color: '#333', fontWeight: 500 }} ellipsis={{ tooltip: cleanSystemLabel(field.label) }}>
                    {cleanSystemLabel(field.label)}
                  </Text>
                ) : <div />}
              </Col>
              <Col span={15}>
                <RenderField
                  field={field}
                  value={formData[field.name]}
                  onChange={(newVal) => handleFormChange(field.name, newVal)}
                />
              </Col>
            </Row>
          ))}
        </div>

        {/* 🔥 SPACER: Khối đệm tự động phình to để đẩy chiều cao Card bằng khít với Panel trái */}
        <div style={{ flex: 1, minHeight: '10px' }} />
      </div>
    )
  }));

  return (
    <Card
      className="card"
      /* Ép Card chiếm trọn 100% chiều cao của cột để bằng khít viền Panel trái */
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: 0 }}
      styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
      <Tabs 
        type="line" 
        items={tabItems} 
        className="dynamic-tabs" 
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }} 
      />
    </Card>
  );
}
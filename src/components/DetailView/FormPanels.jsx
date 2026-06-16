import React from 'react';
import { Card, Row, Col, Typography } from 'antd';

const { Text } = Typography;

export default function FormPanels({ allPanels, formData, handleFormChange, cleanSystemLabel, RenderField }) {
  return (
    <>
      {allPanels.map((panel) => {
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
            /* 🔥 FIX: flex: 1 giúp Card phình to lấp đầy chiều cao được kéo giãn từ Col cha */
            style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}
            styles={{ body: { padding: '24px 16px 12px 16px', flex: 1 } }}
          >
            {Object.keys(rows).map((rowKey) => {
              const fieldsInRow = rows[rowKey].length;

              return (
                <Row gutter={24} key={rowKey} style={{ marginBottom: 14 }}>
                  {rows[rowKey]
                    .sort((a, b) => a.col - b.col)
                    .map((field) => {
                      const colSpan = fieldsInRow > 1 ? 24 / fieldsInRow : 12;
                      const isFullWidthField = field.type === 'text' || field.type === 'bool';
                      const maxInputWidth = isFullWidthField ? '100%' : '380px';

                      return (
                        <Col key={field.name} xs={24} md={colSpan}>
                          <Row gutter={8} align="middle" style={{ width: '100%' }}>
                            <Col span={8} style={{ textAlign: 'right', paddingRight: '6px' }}>
                              {!field.hide_label && field.type !== 'bool' && (
                                <Text style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
                                  {cleanSystemLabel(field.label)}:
                                </Text>
                              )}
                            </Col>
                            <Col
                              span={field.hide_label || field.type === 'bool' ? 24 : 16}
                              style={{ display: 'flex', justifyContent: 'flex-start' }}
                            >
                              <div style={{ width: '100%', maxWidth: maxInputWidth }}>
                                <RenderField
                                  field={field}
                                  value={formData[field.name]}
                                  onChange={(newVal) => handleFormChange(field.name, newVal)}
                                />
                              </div>
                            </Col>
                          </Row>
                        </Col>
                      );
                    })}
                </Row>
              );
            })}
          </Card>
        );
      })}
    </>
  );
}
import React, { useMemo } from 'react';
import { Card, Table, Empty, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function PricePolicySection({ 
  fields = [], 
  lineItemLabel, 
  pricePolicies = [] // Nhận trực tiếp mảng dữ liệu tĩnh từ cha (DetailView) đưa xuống
}) {

  // =================================================================
  // LỌC BỎ CỘT HỆ THỐNG VÀ SẮP XẾP THỨ TỰ HIỂN THỊ CỘT DỰA TRÊN LAYOUT
  // =================================================================
  const displayFields = useMemo(() => {
    return fields
      .filter(f => f.name !== 'id' && f.type !== 'id' && f.name !== f.related_id_field)
      .sort((a, b) => (a.col || 0) - (b.col || 0));
  }, [fields]);

  // =================================================================
  // ĐỘNG CƠ RENDER CELL ĐỘNG CHUYỂN DỊCH HOÀN TOÀN SANG TEXT TĨNH
  // =================================================================
  const renderStaticCell = (field, record, value) => {
    if (value === undefined || value === null || value === '') {
      return <Text style={{ fontSize: '13px', color: '#94a3b8' }}>---</Text>;
    }

    switch (field.type) {
      case 'relate':
        // Hỗ trợ an toàn cả cấu trúc Object lai {id, name} hoặc dạng chuỗi phẳng
        const nameValue = typeof value === 'object' ? value?.name : value;
        return (
          <Text style={{ fontSize: '13px', fontWeight: 600, color: '#0088FF' }}>
            {nameValue || '---'}
          </Text>
        );

      case 'currency':
        return (
          <Text style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            {Number(value).toLocaleString()} đ
          </Text>
        );

      case 'enum':
        const matchedOption = (field.options || []).find(opt => String(opt.value) === String(value));
        return (
          <Text style={{ fontSize: '13px', fontWeight: 500 }}>
            {matchedOption ? matchedOption.label : String(value)}
          </Text>
        );

      case 'date':
        return (
          <Text style={{ fontSize: '13px', color: '#334155' }}>
            {dayjs(value).format('DD/MM/YYYY')}
          </Text>
        );

      case 'bool':
        return (
          <Text style={{ fontSize: '13px', fontWeight: 600, color: value ? '#16a34a' : '#64748b' }}>
            {value ? 'Bật (Có)' : 'Tắt (Không)'}
          </Text>
        );

      default:
        return (
          <Text style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
            {String(value)}
          </Text>
        );
    }
  };

  // =================================================================
  // CẤU HÌNH DANH SÁCH CỘT BẢNG TĨNH - KHÔNG HÀNH ĐỘNG XOÁ
  // =================================================================
  const columns = useMemo(() => {
    return [
      {
        title: 'STT',
        key: 'stt',
        width: 60,
        align: 'center',
        render: (_, __, index) => <Text style={{ color: '#475569', fontWeight: 500 }}>{index + 1}</Text>
      },
      ...displayFields.map(field => ({
        title: field.label,
        dataIndex: field.name,
        key: field.name,
        align: field.type === 'currency' ? 'right' : 'left', 
        render: (value, record) => renderStaticCell(field, record, value)
      }))
    ];
  }, [displayFields]);

  return (
    <Card
      title={<span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', letterSpacing: '0.2px', textTransform: 'uppercase' }}>{lineItemLabel || 'Chi tiết chính sách giá'}</span>}
      style={{ marginTop: 16, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}
      styles={{ head: { textAlign: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }, body: { padding: '12px 16px' } }}
    >
      <Table
        rowKey="id"
        pagination={false}
        dataSource={Array.isArray(pricePolicies) ? pricePolicies : []} 
        columns={columns}
        bordered={false}
        scroll={{ x: 'max-content' }}
        className="static-price-policy-table"
        locale={{ 
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chính sách giá này chưa được cấu hình dữ liệu chi tiết" /> 
        }}
      />
    </Card>
  );
}
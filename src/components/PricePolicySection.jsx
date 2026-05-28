import React from 'react';
import { Card, Table, Button, Select, Input, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function PricePolicySection({ pricePolicies, setPricePolicies }) {
  
  // 1. Giả lập danh sách nhóm khách hàng (Sau này bạn có thể map từ field.options động của SuiteCRM)
  const groupCustomerOptions = [
    { value: 'group_retail', label: 'Khách mua lẻ' },
    { value: 'group_wholesale', label: 'Đại lý / Khách mua sỉ' },
    { value: 'group_vip', label: 'Khách hàng VIP' },
  ];

  // 2. Hàm thêm một dòng chính sách giá mới tinh chỉnh chuẩn cấu trúc dữ liệu
  const handleAddRow = () => {
    setPricePolicies(prev => [
      ...prev,
      {
        id: `policy_${Date.now()}`, // Tạo khóa id duy nhất tạm thời
        group_customer_id: undefined,
        upc: '',
        price_without_vat: ''
      }
    ]);
  };

  // 3. Hàm xóa một dòng dựa trên ID
  const handleRemoveRow = (id) => {
    setPricePolicies(prev => prev.filter(item => item.id !== id));
  };

  // 4. Hàm cập nhật dữ liệu real-time khi người dùng nhập liệu trên từng dòng
  const handleFieldChange = (id, fieldName, value) => {
    setPricePolicies(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [fieldName]: value };
    }));
  };

  // 5. Cấu trúc các cột hiển thị khớp hoàn toàn với ảnh mẫu thiết kế của bạn
  const columns = [
    {
      title: '#',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => <Text style={{ color: '#666' }}>{index + 1}</Text>
    },
    {
      title: 'Nhóm khách hàng',
      dataIndex: 'group_customer_id',
      key: 'group_customer_id',
      render: (value, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Chọn nhóm khách hàng..."
          value={value}
          onChange={(val) => handleFieldChange(record.id, 'group_customer_id', val)}
          options={groupCustomerOptions}
        />
      )
    },
    {
      title: 'UPC',
      dataIndex: 'upc',
      key: 'upc',
      width: '25%',
      render: (value, record) => (
        <Input
          placeholder="Nhập UPC..."
          value={value}
          onChange={(e) => handleFieldChange(record.id, 'upc', e.target.value)}
        />
      )
    },
    {
      title: 'Giá chưa VAT',
      dataIndex: 'price_without_vat',
      key: 'price_without_vat',
      width: '30%',
      render: (value, record) => (
        <Input
          placeholder="0"
          value={value}
          style={{ width: '100%' }}
          onChange={(e) => handleFieldChange(record.id, 'price_without_vat', e.target.value)}
        />
      )
    },
    {
      title: 'Xóa',
      key: 'action_delete',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button 
          type="primary"
          danger
          shape="round"
          icon={<DeleteOutlined />}
          style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 500 }}
          onClick={() => handleRemoveRow(record.id)}
        >
          Xóa
        </Button>
      )
    }
  ];

  return (
    <Card
      title={<span style={{ fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chính sách giá</span>}
      style={{ marginTop: 16, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      styles={{ body: { padding: '16px' } }}
    >
      <Table
        rowKey="id"
        pagination={false}
        dataSource={pricePolicies}
        columns={columns}
        bordered
        locale={{ emptyText: 'Chưa có cấu hình chính sách giá nào cho sản phẩm này' }}
        style={{ marginBottom: 16 }}
      />

      {/* NÚT THÊM DÒNG CHUẨN UI XANH DƯƠNG ĐẬM CỦA BẠN */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        size="large"
        style={{ 
          backgroundColor: '#0088FF', 
          borderColor: '#0088FF', 
          fontWeight: 600, 
          borderRadius: '4px',
          textTransform: 'uppercase',
          fontSize: 13
        }}
        onClick={handleAddRow}
      >
        Thêm chính sách giá
      </Button>
    </Card>
  );
}
import React, { useEffect } from 'react';
import { Card, Table, Button, Input, InputNumber, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import RelateModelSelect from './RelateModelSelect';

const { Text } = Typography;

export default function PricePolicySection({ 
  fields = [], 
  lineItemLabel, 
  pricePolicies = [],     // ✅ Nhận trực tiếp mảng dữ liệu từ cha đưa xuống
  setPricePolicies,       // ✅ Nhận trực tiếp hàm cập nhật State tổng của cha
  isLayoutLoading = false // ✅ Trạng thái loading layout từ cha để chặn ghi đè dữ liệu cũ
}) {

  // =================================================================
  // ĐỒNG BỘ KHỞI TẠO: Chỉ tự thêm 1 dòng trống khi thực sự là ĐƠN TẠO MỚI 
  // =================================================================
  useEffect(() => {
    // Nếu hệ thống đang fetch dữ liệu cũ từ DB, tuyệt đối không tự ý chèn dòng trống
    if (isLayoutLoading) return;

    if (pricePolicies.length === 0 && fields.length > 0) {
      const initialRow = { id: `policy_init_${Date.now()}` };
      fields.forEach(f => {
        initialRow[f.name] = f.default !== undefined ? f.default : '';
      });
      setPricePolicies([initialRow]);
    }
  }, [fields, pricePolicies.length, setPricePolicies, isLayoutLoading]);

  // Lọc bỏ ID hệ thống và sắp xếp thứ tự hiển thị cột theo cấu hình layout con
  const displayFields = fields
    .filter(f => f.name !== 'id' && f.type !== 'id' && f.name !== f.related_id_field)
    .sort((a, b) => (a.col || 0) - (b.col || 0));

  // 1. Hàm thêm dòng mới
  const handleAddRow = () => {
    const newRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    fields.forEach(f => {
      newRow[f.name] = f.default !== undefined ? f.default : '';
    });
    // Gọi callback an toàn để đẩy phần tử mới vào mảng ở cha
    setPricePolicies(currentArray => [...currentArray, newRow]); 
  };

  // 2. Hàm xóa dòng
  const handleRemoveRow = (id) => {
    setPricePolicies(currentArray => currentArray.filter(item => item.id !== id));
  };

  // 3. Hàm cập nhật field thông thường cho dòng (gõ ký tự nào cập nhật ngay ký tự đó)
  const handleRowChange = (rowId, fieldName, value) => {
    setPricePolicies(currentArray =>
      currentArray.map(row => (row.id === rowId ? { ...row, [fieldName]: value } : row))
    );
  };

  // 4. Hàm cập nhật riêng kiểu Relate thích ứng cấu trúc lai Object {id, name} của API
  const handleRelateChange = (rowId, relateField, selectedData) => {
    setPricePolicies(currentArray =>
      currentArray.map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            [relateField.name]: selectedData ? {
              id: selectedData.id,
              name: selectedData.name,
              module: relateField.related_module
            } : null,
            [relateField.related_id_field]: selectedData?.id || ''
          };
        }
        return row;
      })
    );
  };

  // 5. Render Cell động bám sát Metadata layout con
  const renderCellComponent = (field, record, value) => {
    switch (field.type) {
      case 'relate':
        // Xử lý an toàn: dữ liệu truyền vào có thể là Object chuẩn hoặc String thô từ database cũ
        const currentRelateValue = typeof value === 'object' && value !== null
          ? value 
          : { id: record[field.related_id_field], name: value || '' };

        return (
          <RelateModelSelect
            value={currentRelateValue}
            onChange={(newVal) => handleRelateChange(record.id, field, newVal)}
            disabled={field.readonly}
            placeholder={`Chọn ${field.label}...`}
            field={{ related_module: field.related_module }}
          />
        );

      case 'currency':
        return (
          <InputNumber
            placeholder={field.default || '0'}
            value={value}
            disabled={field.readonly}
            style={{ width: '100%' }}
            formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={val => val.replace(/\$\s?|(,*)/g, '')}
            onChange={(val) => handleRowChange(record.id, field.name, val)}
          />
        );

      case 'varchar':
      case 'name':
      default:
        return (
          <Input
            placeholder={`Nhập ${field.label}...`}
            value={value}
            disabled={field.readonly}
            maxLength={Number(field.len) || undefined}
            onChange={(e) => handleRowChange(record.id, field.name, e.target.value)}
          />
        );
    }
  };

  // 6. Cấu hình danh sách cột cho AntD Table
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => <Text style={{ color: '#666' }}>{index + 1}</Text>
    },
    ...displayFields.map(field => ({
      title: field.label,
      dataIndex: field.name,
      key: field.name,
      align: field.type === 'currency' ? 'right' : 'left', 
      render: (value, record) => renderCellComponent(field, record, value)
    })),
    {
      title: 'Hành động',
      key: 'action_delete',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button 
          type="primary"
          danger
          shape="round"
          icon={<DeleteOutlined />}
          style={{ fontSize: 12, fontWeight: 500 }}
          onClick={() => handleRemoveRow(record.id)}
        >
          Xóa
        </Button>
      )
    }
  ];

  return (
    <Card
      title={<span style={{ fontWeight: 600, fontSize: 14, textTransform: 'uppercase' }}>{lineItemLabel}</span>}
      style={{ marginTop: 16, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
      styles={{ body: { padding: '16px' } }}
    >
      <Table
        rowKey="id"
        pagination={false}
        // Đảm bảo dataSource luôn nhận định dạng mảng để không bị dính lỗi .some() của AntD
        dataSource={Array.isArray(pricePolicies) ? pricePolicies : []} 
        columns={columns}
        bordered
        locale={{ emptyText: 'Chưa có cấu hình dữ liệu nào' }}
        style={{ marginBottom: 16 }}
      />

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
        Thêm dòng mới
      </Button>
    </Card>
  );
}
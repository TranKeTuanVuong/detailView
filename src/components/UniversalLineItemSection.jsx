import React, { useEffect } from 'react';
import { Card, Table, Button, Input, InputNumber, Typography, DatePicker, Select, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import RelateModelSelect from './RelateModelSelect';

const { Text } = Typography;

export default function UniversalLineItemSection({
  name,
  fields = [],
  lineItemLabel,
  dataSource = [],
  setDataSource,
  isLayoutLoading = false,
  promoType,
  promoProdType,
  selectedMethod, 
  isDiscountQty
}) {

  // =====================================================
  // INIT DATA GỐC (Bảo toàn nguyên vẹn cấu trúc thuộc tính cho CRM)
  // =====================================================
  useEffect(() => {
    if (isLayoutLoading) return;
    if (dataSource.length === 0) {
      setDataSource([createEmptyGroup()]);
    }
  }, []);

  const createEmptyGroup = () => {
    const group = {
      id: `group_${Date.now()}`,
      tiers: [createEmptyTier()]
    };
    fields.forEach(field => {
      group[field.name] = field.default !== undefined ? field.default : '';
    });
    if (!isDiscountQty) {
      group.discount = '';
      group.discount_type = 'percent';
    }
    return group;
  };

  const createEmptyTier = () => ({
    id: `tier_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    from_qty: '',
    to_qty: '',
    discount: '',
    discount_type: 'percent'
  });

  // =====================================================
  // ACTIONS (HANDLERS)
  // =====================================================
  const handleAddGroup = () => {
    setDataSource(prev => [...prev, createEmptyGroup()]);
  };

  const handleRemoveGroup = (groupId) => {
    setDataSource(prev => prev.filter(x => x.id !== groupId));
  };

  const handleAddTier = (groupId) => {
    setDataSource(prev =>
      prev.map(group => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          tiers: [...(group.tiers || []), createEmptyTier()]
        };
      })
    );
  };

  const handleRemoveTier = (groupId, tierId) => {
    setDataSource(prev =>
      prev.map(group => {
        if (group.id !== groupId) return group;
        
        const filteredTiers = group.tiers.filter(t => t.id !== tierId);
        if (filteredTiers.length === 0) return null; 

        return { ...group, tiers: filteredTiers };
      }).filter(Boolean)
    );
  };

  const handleGroupChange = (groupId, fieldName, value) => {
    setDataSource(prev =>
      prev.map(group => (group.id === groupId ? { ...group, [fieldName]: value } : group))
    );
  };

  const handleTierChange = (groupId, tierId, fieldName, value) => {
    setDataSource(prev =>
      prev.map(group => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          tiers: group.tiers.map(tier =>
            tier.id === tierId ? { ...tier, [fieldName]: value } : tier
          )
        };
      })
    );
  };

  const handleRelateChange = (groupId, field, selectedData) => {
    setDataSource(prev =>
      prev.map(group => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          [field.name]: selectedData ? { id: selectedData.id, name: selectedData.name } : null,
          [field.related_id_field]: selectedData?.id || ''
        };
      })
    );
  };

  // =====================================================
  // DYNAMIC FIELD RENDERER
  // =====================================================
  const renderField = (field, group) => {
    const value = group[field.name];

    switch (field.type) {
      case 'relate':
        return (
          <RelateModelSelect
            value={value ? { id: value.id, name: value.name } : null}
            field={{ related_module: field.related_module }}
            placeholder={`Chọn ${field.label}...`}
            onChange={(val) => handleRelateChange(group.id, field, val)}
          />
        );

      case 'enum':
        return (
          <Select
            value={value || undefined}
            placeholder={`Chọn ${field.label}...`}
            style={{ width: '100%' }}
            options={(field.options || []).map(opt => ({ value: opt.value, label: opt.label }))}
            onChange={(val) => handleGroupChange(group.id, field.name, val)}
          />
        );

      case 'bool':
        return (
          <Checkbox
            checked={!!value}
            onChange={(e) => handleGroupChange(group.id, field.name, e.target.checked)}
          />
        );

      case 'date':
        return (
          <DatePicker
            style={{ width: '100%' }}
            value={value ? dayjs(value) : null}
            onChange={(date, str) => handleGroupChange(group.id, field.name, str)}
          />
        );

      case 'currency':
      case 'decimal':
      case 'int':
        return (
          <InputNumber
            value={value}
            placeholder={field.label}
            formatter={val => field.type === 'currency' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : val}
            parser={val => val.replace(/\$\s?|(,*)/g, '')}
            style={{ width: '100%' }}
            onChange={(val) => handleGroupChange(group.id, field.name, val)}
          />
        );

      default:
        return (
          <Input
            value={value}
            placeholder={field.label}
            onChange={(e) => handleGroupChange(group.id, field.name, e.target.value)}
          />
        );
    }
  };

  // =================================================================
  // 🎯 BỘ LỌC ĐỘNG FIELD - CHẶN SẠCH CÁC BIẾN SỐ LƯỢNG GỐC CỦA CRM
  // =================================================================
  const filteredFields = fields
    .filter(field => {
      const fieldName = String(field.name).toLowerCase();

      // 1. Luôn ẩn các trường định danh ID thô hệ thống hoặc cột chiết khấu thô mặc định của layout gốc
      if (
        field.name === 'id' || 
        field.type === 'id' || 
        field.name === field.related_id_field ||
        fieldName.includes('_id') ||
        fieldName === 'discount' || 
        fieldName === 'discount_type'
      ) {
        return false;
      }

      // 🛑 2. ĐÃ SỬA TRIỆT ĐỂ: Chặn sạch bách mọi biến thể tên trường số lượng dôi dư l lọt từ API layout ra ngoài
      if (isDiscountQty) {
        if (
          fieldName.includes('qty') || 
          fieldName.includes('sl_') || 
          fieldName.includes('from_qty') || 
          fieldName.includes('to_qty') ||
          fieldName === 'qty_from' || 
          fieldName === 'qty_to'
        ) {
          return false;
        }
      }

      // 3. Ẩn cột order_value khi chạy luồng chiết khấu số lượng bậc thang
      if (selectedMethod === 'discount_qty_product' && isDiscountQty) {
        if (fieldName === 'order_value' || fieldName.includes('order_value') || fieldName === 'from_value' || fieldName === 'to_value') {
          return false; 
        }
      }

      // 4. Nếu đang chọn "Tặng sản phẩm" (free_gifts) -> Ẩn sạch các cột chứa từ khóa chiết khấu thô
      if (promoType === 'free_gifts') {
        if (fieldName.includes('discount')) {
          return false;
        }
      }

      // 5. Điều kiện ẩn hiện cột định danh theo ô Loại sản phẩm áp dụng (promoProdType) trên Form chính
      if (selectedMethod === 'discount_by_product' || selectedMethod === 'discount_qty_product') {
        switch (promoProdType) {
          case 'product_name':
            if (fieldName === 'prod_cat' || fieldName === 'brand' || fieldName.includes('category') || fieldName.includes('brand')) {
              return false;
            }
            break;

          case 'product_cat':
            if (fieldName === 'prod_cat' || fieldName.includes('category')) return true;
            if (fieldName === 'product' || fieldName.includes('brand') || fieldName === 'purchased_prod') {
              return false;
            }
            break;

          case 'product_brand':
            if (fieldName === 'brand' || fieldName.includes('brand')) return true;
            if (fieldName === 'product' || fieldName === 'prod_cat' || fieldName.includes('category') || fieldName === 'purchased_prod') {
              return false;
            }
            break;

          default:
            break;
        }
      }

      return true;
    })
    .sort((a, b) => (a.col || 0) - (b.col || 0));

  // =====================================================
  // LÀM PHẲNG DATA ĐỂ BIỂU DIỄN LÊN TABLE ANTD
  // =====================================================
  const tableData = [];
  dataSource.forEach((group, groupIndex) => {
    (group.tiers || []).forEach((tier, tierIndex) => {
      tableData.push({
        tableRowKey: `${group.id}_${tier.id}`, 
        groupIndex,
        tierIndex,
        totalTiers: group.tiers.length,
        groupData: group, 
        tierData: tier    
      });
    });
  });

  // =====================================================
  // CẤU TRÚC MA TRẬN CỘT PHẲNG TUYỆT ĐỐI
  // =====================================================
  const columns = [
    // 1. CỘT STT CỐ ĐỊNH
    {
      title: 'STT',
      key: 'stt',
      width: 65,
      align: 'center',
      render: (_, record) => {
        return {
          children: <Text style={{ color: '#666', fontWeight: 500 }}>{record.groupIndex + 1}</Text>,
          props: {
            rowSpan: isDiscountQty ? (record.tierIndex === 0 ? record.totalTiers : 0) : 1
          }
        };
      }
    },
    
    // 2. RENDERING ĐƠN TUYẾN PHẲNG THEO MẢNG FILTERED FIELDS CHUẨN MA TRẬN
    ...filteredFields.map(field => ({
      title: field.label,
      key: field.name,
      render: (_, record) => {
        return {
          children: renderField(field, record.groupData),
          props: {
            rowSpan: isDiscountQty ? (record.tierIndex === 0 ? record.totalTiers : 0) : 1
          }
        };
      }
    })),

    // 3. CỘT SỐ LƯỢNG TĨNH CHUẨN (CHỈ BẬT CHO LUỒNG SỐ LƯỢNG BẬC THANG SGT_DISCOUNT_QTY)
    ...(isDiscountQty ? [
      {
        title: 'SL từ',
        key: 'from_qty',
        width: 130,
        render: (_, record) => (
          <InputNumber
            value={record.tierData.from_qty}
            placeholder="SL từ"
            style={{ width: '100%' }}
            onChange={(val) => handleTierChange(record.groupData.id, record.tierData.id, 'from_qty', val)}
          />
        )
      },
      {
        title: 'SL đến',
        key: 'to_qty',
        width: 130,
        render: (_, record) => (
          <InputNumber
            value={record.tierData.to_qty}
            placeholder="SL đến"
            style={{ width: '100%' }}
            onChange={(val) => handleTierChange(record.groupData.id, record.tierData.id, 'to_qty', val)}
          />
        )
      }
    ] : []),

    // 4. CỘT CHIẾT KHẤU TĨNH (LUÔN THẲNG HÀNG NGANG, TỰ ĐỘNG ẨN HOÀN TOÀN NẾU CHỌN TẶNG QUÀ - FREE_GIFTS)
    ...(promoType !== 'free_gifts' ? [{
      title: 'Chiết khấu',
      key: 'discount',
      width: 240, 
      render: (_, record) => {
        const currentDiscount = isDiscountQty ? record.tierData.discount : record.groupData.discount;
        const currentType = isDiscountQty ? record.tierData.discount_type : record.groupData.discount_type;

        return {
          children: (
            <div style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center', flexWrap: 'nowrap' }}>
              <InputNumber
                value={currentDiscount}
                placeholder="Mức thưởng"
                style={{ minWidth: 80, flex: 1 }}
                onChange={(val) => isDiscountQty 
                  ? handleTierChange(record.groupData.id, record.tierData.id, 'discount', val)
                  : handleGroupChange(record.groupData.id, 'discount', val)
                }
              />
              <Select
                value={currentType || 'percent'}
                style={{ width: 85, minWidth: 85, flexShrink: 0 }}
                options={[
                  { label: '%', value: 'percent' },
                  { label: 'VNĐ', value: 'direct' }
                ]}
                onChange={(val) => isDiscountQty
                  ? handleTierChange(record.groupData.id, record.tierData.id, 'discount_type', val)
                  : handleGroupChange(record.groupData.id, 'discount_type', val)
                }
              />
            </div>
          ),
          props: {
            rowSpan: 1
          }
        };
      }
    }] : []),

    // 5. CỘT HÀNH ĐỘNG CỐ ĐỊNH CỦA BẢNG
    {
      title: 'Hành động',
      key: 'action_delete',
      width: 130,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Button
            type="primary"
            danger
            shape="round"
            icon={<DeleteOutlined />}
            onClick={() => isDiscountQty 
              ? handleRemoveTier(record.groupData.id, record.tierData.id)
              : handleRemoveGroup(record.groupData.id)
            }
          >
            Xóa
          </Button>

          {isDiscountQty && record.tierIndex === record.totalTiers - 1 && (
            <Button
              type="link"
              size="small"
              style={{ fontWeight: 600, color: '#0088FF', padding: 0, fontSize: 12 }}
              onClick={() => handleAddTier(record.groupData.id)}
            >
              + Thêm số lượng
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <Card
      title={<span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '0.3px' }}>{lineItemLabel}</span>}
      style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}
      styles={{ head: { textAlign: 'center', background: '#ffffff', paddingTop: 16 }, body: { padding: '12px 20px' } }}
    >
      <Table
        rowKey="tableRowKey"
        pagination={false}
        dataSource={tableData}
        columns={columns}
        bordered
        locale={{ emptyText: 'Chưa có cấu hình dữ liệu nào' }}
        style={{ marginBottom: 20 }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{
            backgroundColor: '#0088FF',
            borderColor: '#0088FF',
            fontWeight: 600,
            borderRadius: '6px',
            fontSize: 13,
            padding: '0 24px',
            height: '40px'
          }}
          onClick={handleAddGroup}
        >
          {name || 'Thêm điều kiện'}
        </Button>
      </div>
    </Card>
  );
}
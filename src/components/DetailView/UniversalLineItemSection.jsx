import React, { useMemo } from 'react';
import { Card, Table, Empty, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

// =================================================================
// 🏛️ COMPONENT CHÍNH UNIVERSAL LINE ITEM SECTION (STATIC DETAIL MODE)
// =================================================================
export default function UniversalLineItemSection({
  fields = [],
  lineItemLabel,
  dataSource = [],
  promoType,
  promoProdType,
  selectedMethod, 
  isDiscountQty
}) {

  // =================================================================
  // 🎯 BỘ LỌC ĐỘNG FIELD - ĐỒNG BỘ 100% ẨN HIỆN THEO ĐIỀU KIỆN FORM CHA
  // =================================================================
  const filteredFields = useMemo(() => {
    return fields
      .filter(field => {
        const fieldName = String(field.name).toLowerCase();

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

        // 🌟 SỬA LỖI HIỂN THỊ: Chỉ ẩn cột số lượng layout nếu ĐANG CHẠY LUỒNG BẬC THANG (để thay bằng SL từ/đến).
        // Nếu là luồng thường đơn tuyến, PHẢI giữ lại trường số lượng (ví dụ: qty_c, sl_c) để hiển thị dữ liệu.
        if (isDiscountQty) {
          if (
            fieldName.includes('from_qty') || 
            fieldName.includes('to_qty') ||
            fieldName === 'qty_from' || 
            fieldName === 'qty_to' ||
            fieldName === 'qty' ||
            fieldName === 'qty_c'
          ) {
            return false;
          }
        }

        if (selectedMethod === 'discount_qty_product' && isDiscountQty) {
          if (fieldName === 'order_value' || fieldName.includes('order_value') || fieldName === 'from_value' || fieldName === 'to_value') {
            return false; 
          }
        }

        if (promoType === 'free_gifts') {
          if (fieldName.includes('discount')) {
            return false;
          }
        }

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
  }, [fields, isDiscountQty, selectedMethod, promoType, promoProdType]);

  // =====================================================
  // 🌟 LÀM PHẲNG DATA ĐỂ BIỂU DIỄN LÊN TABLE TĨNH
  // =====================================================
  const tableData = useMemo(() => {
    const tableRows = [];
    const safeDataSource = Array.isArray(dataSource) ? dataSource : [];

    safeDataSource.forEach((group, groupIndex) => {
      if (!group) return;
      const currentTiers = Array.isArray(group.tiers) ? group.tiers : [];

      if (!isDiscountQty) {
        // Luồng 1: Cấu hình dạng phẳng đơn dòng truyền thống
        tableRows.push({
          tableRowKey: group.id || `static_group_row_${groupIndex}`,
          groupIndex,
          tierIndex: 0,
          totalTiers: 1,
          groupData: group,
          tierData: {}
        });
      } else {
        // Luồng 2: Cấu hình bậc thang số lượng lồng tiers -> Bung phẳng gộp ô hàng dọc
        const displayTiers = currentTiers.length === 0 ? [{ id: `fake_${groupIndex}` }] : currentTiers;
        displayTiers.forEach((tier, tierIndex) => {
          tableRows.push({
            tableRowKey: `${group.id}_${tier.id || tierIndex}`, 
            groupIndex,
            tierIndex,
            totalTiers: displayTiers.length,
            groupData: group, 
            tierData: tier    
          });
        });
      }
    });
    return tableRows;
  }, [dataSource, isDiscountQty]);

  // =====================================================
  // DYNAMIC FIELD RENDERER CHUYỂN HOÀN TOÀN THÀNH TEXT TĨNH
  // =====================================================
  const renderStaticField = (field, group) => {
    const value = group[field.name];
    if (value === undefined || value === null || value === '') return <Text style={{ fontSize: '13px', color: '#94a3b8' }}>---</Text>;

    switch (field.type) {
      case 'relate':
        return (
          <Text style={{ fontSize: '13px', fontWeight: 600, color: '#0088FF' }}>
            {typeof value === 'object' ? (value?.name || '---') : String(value)}
          </Text>
        );

      case 'enum':
        const matchedOption = (field.options || []).find(opt => String(opt.value) === String(value));
        return <Text style={{ fontSize: '13px', fontWeight: 500 }}>{matchedOption ? matchedOption.label : String(value)}</Text>;

      case 'bool':
        return <Text style={{ fontSize: '13px', fontWeight: 600, color: value ? '#16a34a' : '#64748b' }}>{value ? 'Bật (Có)' : 'Tắt (Không)'}</Text>;

      case 'date':
        return <Text style={{ fontSize: '13px', color: '#334155' }}>{dayjs(value).format('DD/MM/YYYY')}</Text>;

      case 'currency':
        return <Text style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{Number(value).toLocaleString()} đ</Text>;
        
      case 'decimal':
      case 'float':
      case 'int':
        return <Text style={{ fontSize: '13px', fontWeight: 500 }}>{Number(value).toLocaleString()}</Text>;

      default:
        return <Text style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{String(value)}</Text>;
    }
  };

  // =====================================================
  // MA TRẬN CỘT BẢNG TĨNH - KHÔNG SỬA ĐỔI, KHÔNG XOÁ DÒNG
  // =====================================================
  const columns = useMemo(() => {
    // Tự động kiểm tra module Chính sách giá đè để phục vụ ẩn hiện cột tương thích chéo
    const isPricePolicyModule = String(lineItemLabel).toLowerCase().includes('chính sách giá') || 
                                String(lineItemLabel).toLowerCase().includes('price_policy');

    return [
      // 1. Cột Số thứ tự gộp dòng dọc theo trục nhóm cha
      {
        title: 'STT',
        key: 'stt',
        width: 60,
        align: 'center',
        render: (_, record) => ({
          children: <Text style={{ color: '#475569', fontWeight: 500 }}>{record.groupIndex + 1}</Text>,
          props: {
            rowSpan: isDiscountQty ? (record.tierIndex === 0 ? record.totalTiers : 0) : 1
          }
        })
      },
      
      // 2. Toàn bộ các cột dữ liệu động bốc từ Metadata Layout (Sản phẩm, Danh mục, Thương hiệu...)
      ...filteredFields.map(field => ({
        title: field.label,
        key: field.name,
        render: (_, record) => ({
          children: renderStaticField(field, record.groupData),
          props: {
            rowSpan: isDiscountQty ? (record.tierIndex === 0 ? record.totalTiers : 0) : 1
          }
        })
      })),

      // 3. Hai cột Số lượng tĩnh (SL từ / SL đến) - CHỈ BẬT KHI CHẠY LUỒNG BẬC THANG (isDiscountQty === true)
      ...(isDiscountQty ? [
        {
          title: 'SL từ',
          key: 'from_qty',
          width: 120,
          align: 'center',
          render: (_, record) => {
            const num = record.tierData?.from_qty;
            return <Text style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{num !== undefined && num !== '' ? Number(num).toLocaleString() : '0'}</Text>;
          }
        },
        {
          title: 'SL đến',
          key: 'to_qty',
          width: 120,
          align: 'center',
          render: (_, record) => {
            const num = record.tierData?.to_qty;
            return <Text style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{num !== undefined && num !== '' ? Number(num).toLocaleString() : '∞'}</Text>;
          }
        }
      ] : []),

      // 4. Cột mức thưởng Chiết khấu tĩnh dạng văn bản sạch
      // Tự động ẩn hoàn toàn nếu chọn Tặng sản phẩm (free_gifts) hoặc trúng phân hệ Chính sách giá (sgt_price_policy)
      ...(promoType !== 'free_gifts' && !isPricePolicyModule ? [{
        title: 'Chiết khấu',
        key: 'discount',
        width: 160, 
        align: 'center',
        render: (_, record) => {
          const currentDiscount = isDiscountQty ? record.tierData?.discount : record.groupData?.discount;
          const currentType = isDiscountQty ? record.tierData?.discount_type : record.groupData?.discount_type;
          
          if (currentDiscount === undefined || currentDiscount === null || currentDiscount === '') {
            return <Text style={{ fontSize: '13px', color: '#94a3b8' }}>0 đ</Text>;
          }

          return (
            <Text style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>
              {currentType === 'percent' ? `${currentDiscount} %` : `${Number(currentDiscount).toLocaleString()} VNĐ`}
            </Text>
          );
        }
      }] : [])
    ];
  }, [filteredFields, isDiscountQty, promoType, lineItemLabel]);

  return (
    <Card
      title={<span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', letterSpacing: '0.2px' }}>{lineItemLabel || 'Cấu hình chi tiết'}</span>}
      style={{ marginTop: 16, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)', overflow: 'hidden' }}
      styles={{ head: { textAlign: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }, body: { padding: '12px 16px' } }}
    >
      <Table
        rowKey="tableRowKey"
        pagination={false}
        dataSource={tableData}
        columns={columns}
        bordered
        scroll={{ x: 'max-content' }}
        className="static-universal-table"
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bản ghi chưa được cấu hình dữ liệu chi tiết" /> }}
      />
    </Card>
  );
}
import React, { useMemo } from 'react';
import { Card, Table, Empty, Typography } from 'antd';
import dayjs from 'dayjs';
import LineItemsFooter from "/src/components/DetailView/LineItemsFooter"; // 🌟 Import footer vào để hiển thị

const { Text } = Typography;

// =================================================================
// 🏛️ COMPONENT CHÍNH LAYOUT LINE ITEMS SECTION (STATIC READ-ONLY MODE)
// =================================================================
export default function LineItemsSection({
  panel,               
  lineItems,
  formData,            // 🌟 Nhận dữ liệu form cha truyền xuống để tính tổng footer
  cleanSystemLabel
}) {

  // 1. PHÂN TÍCH NHÓM TRƯỜNG: Gom cụm các trường từ metadata để tránh sinh trùng lặp cột dọc
  const groupedFields = useMemo(() => {
    const groups = {};
    (panel?.fields || [])
      .filter(field => {
        const cleanName = field.name?.trim();
        return cleanName !== 'line_item_c' && cleanName !== 'qty_c' && cleanName !== 'subtotal_c';
      })
      .forEach(field => {
        let normalized = field.name?.trim();
        if (normalized.includes('discount')) normalized = 'discount';
        
        if (!groups[normalized]) groups[normalized] = [];
        groups[normalized].push(field);
      });
    return groups;
  }, [panel]);

  // 2. ĐỘNG CƠ DỰNG CỘT TỰ ĐỘNG KHỚP NỐI PAYLOAD DYNAMIC BACKEND
  const columns = useMemo(() => {
    return [
      {
        title: 'STT',
        key: 'stt',
        width: 55,
        align: 'center',
        render: (_, __, index) => <Text style={{ fontSize: '13px' }}>{index + 1}</Text>
      },
      ...Object.entries(groupedFields).map(([fieldKey, fields]) => {
        const mainField = fields[0];

        // 🌟 CỘT A: HÌNH ẢNH SẢN PHẨM TĨNH
        if (fieldKey === 'product_image_c') {
          return {
            title: <span className="table-header-bold">Ảnh sản phẩm</span>,
            dataIndex: 'product_image', 
            key: fieldKey,
            width: 80,
            align: 'center',
            render: (imgUrl, record) => {
              const url = imgUrl || record.product_image_c;
              return url ? (
                <img 
                  src={url} 
                  alt="Sản phẩm" 
                  style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} 
                />
              ) : (
                <div style={{ width: 45, height: 45, backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14, margin: '0 auto' }}>🖼️</div>
              );
            }
          };
        }

        // 🌟 CỘT B: LÔ HÀNG XT KHO TĨNH
        if (fieldKey === 'sgt_shipment_id_c') {
          return {
            title: <span className="table-header-bold">Lô hàng</span>,
            key: fieldKey,
            align: 'center',
            width: 120,
            render: (_, record) => {
              const shipment = record?.shipment_data;
              return (
                <Text style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                  {shipment?.lot_name 
                    ? dayjs(shipment.import_date).format('DD/MM/YYYY') 
                    : (record.sgt_shipment_id_c_label || 'Lô mặc định')}
                </Text>
              );
            }
          };
        }

        // 🌟 CỘT C: NHÓM SỐ LƯỢNG - CHIẾT KHẤU - THÀNH TIỀN TĨNH
        if (fieldKey === 'discount') {
          return [
            {
              title: <span className="table-header-bold">Số lượng</span>,
              dataIndex: 'qty_c',
              key: 'custom_qty_column_cell',
              width: 85,
              align: 'center',
              render: (v) => <Text style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{v || 1}</Text>
            },
            {
              title: <span className="table-header-bold">Chiết khấu</span>,
              key: 'discount_group_column',
              align: 'center',
              width: 110,
              render: (_, record) => {
                const discVal = Number(record.discount_sp_c || record.discount_c || 0);
                const discType = record.discount_type_sp_c || record.discount_type || 'direct';
                
                if (record.is_promo_gift) return <Text style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>Miễn phí 🎁</Text>;
                if (discVal === 0) return <Text style={{ fontSize: '13px', color: '#94a3b8' }}>0 đ</Text>;
                
                return (
                  <Text style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                    {discType === 'percent' ? `${discVal} %` : `${discVal.toLocaleString()} đ`}
                  </Text>
                );
              }
            },
            {
              title: <span className="table-header-bold">Tổng tiền</span>,
              dataIndex: 'subtotal_c',
              key: 'custom_subtotal_column_cell',
              width: 120,
              align: 'right',
              render: (v) => {
                const num = Number(v || 0);
                return <Text style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c' }}>{num.toLocaleString()} đ</Text>;
              }
            }
          ];
        }

        // 🌟 CỘT D: CÁC CỘT LAYOUT ĐỘNG KHÁC (TÊN SẢN PHẨM, ĐƠN GIÁ CHƯA VAT...)
        return {
          title: <span className="table-header-bold">{cleanSystemLabel(mainField.label)}</span>,
          dataIndex: fieldKey,
          key: fieldKey,
          render: (v, record) => {
            if (fieldKey === 'name_sp_c' || fieldKey === 'product_name') {
              const productName = record.product_name || record.name_sp_c || record.name || '---';
              return (
                <div style={{ width: '240px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '13px', fontWeight: 500, color: '#0f172a', textAlign: 'left' }}>
                  {productName}
                </div>
              );
            }

            if (mainField.type === 'currency' || fieldKey === 'price_c') {
              const priceNum = Number(v || record.price_c || 0);
              return <Text style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{priceNum.toLocaleString()} đ</Text>;
            }

            if (mainField.type === 'enum') {
              const matchedOption = (mainField.options || []).find(opt => String(opt.value) === String(v));
              return <Text style={{ fontSize: '13px' }}>{matchedOption ? matchedOption.label : (v || '---')}</Text>;
            }

            return <Text style={{ fontSize: '13px', color: '#334155' }}>{v || '---'}</Text>;
          }
        };
      }).flat()
    ];
  }, [groupedFields, cleanSystemLabel]);

  return (
    <Card
      key={panel?.key}
      title={<span className="panel-title-bold">{cleanSystemLabel(panel?.label || 'Danh sách sản phẩm')}</span>}
      style={{ marginTop: 16, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
      styles={{ body: { padding: '12px' } }}
    >
      <Table
        rowKey={(record) => record.id || record.aos_products_id_c || Math.random()} 
        pagination={false}
        dataSource={lineItems}
        columns={columns}
        scroll={{ x: 'max-content' }}
        bordered={false}
        className="custom-detail-table"
        locale={{ 
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Đơn hàng không có dữ liệu sản phẩm chi tiết" /> 
        }}
      />

      {/* ====================================================================
          🌟 🟢 KHU VỰC HIỂN THỊ LINE ITEMS FOOTER Ở CHẾ ĐỘ XEM CHI TIẾT TĨNH
          Khóa cứng các hàm update để chạy an toàn tuyệt đối không gây lỗi Crash UI
          ==================================================================== */}
      {panel?.line_item_source_module === 'sgt_orderdetail' ? (
        <div style={{ marginTop: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
          <LineItemsFooter 
            lineItems={lineItems}
               // Khóa hàm cập nhật sản phẩm ở footer
            formData={formData}
            // Khóa hàm thay đổi trường form chính ở footer
            isPromoOpen={false}
           
          />
        </div>
      ) : null}
    </Card>
  );
}
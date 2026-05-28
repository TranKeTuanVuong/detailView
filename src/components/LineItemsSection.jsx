import React, { useState, useMemo } from 'react';
import { Card, Select, Table, Input, Modal, Button, Empty, Typography, InputNumber } from 'antd';
import dayjs from 'dayjs';
import LineItemsFooter from '../components/LineItemsFooter';

const { Text } = Typography;

export default function LineItemsSection({
  panel,               // 🔥 Đã đồng bộ nhận panel đơn lẻ từ file cha
  lineItems,
  setLineItems,
  formData,            
  handleFormChange,     
  handleSelectProduct,
  handleRemoveLine,
  handleTableFieldChange,
  cleanSystemLabel
}) {
  const [openShipmentModal, setOpenShipmentModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [shipmentKeyword, setShipmentKeyword] = useState('');
  
  const [allShipments] = useState([
    { id: 'sh_01', import_date: '2026-05-10', quantity_on_hand: 100, qty_cansell: 85 },
    { id: 'sh_02', import_date: '2026-05-15', quantity_on_hand: 50, qty_cansell: 40 },
  ]);

  if (!panel) return null;

  // --- XỬ LÝ GOM NHÓM FIELDS THEO HÀNG (Sử dụng trực tiếp object panel nhận vào) ---
  const normalizeFieldName = (name = '') => {
    let cleanName = name.trim();
    if (cleanName.includes('discount')) return 'discount';
    return cleanName;
  };

  const groupedFields = {};
  (panel.fields || [])
    .filter(field => field.name !== 'line_item_c')
    .forEach(field => {
      const normalized = normalizeFieldName(field.name);
      if (!groupedFields[normalized]) groupedFields[normalized] = [];
      groupedFields[normalized].push(field);
    });

  // --- KHỞI TẠO CẤU TRÚC COLUMNS ---
  const columns = useMemo(() => {
    return [
      {
        title: 'STT',
        key: 'stt',
        width: 55,
        align: 'center',
        render: (_, record, index) => <Text>{index + 1}</Text>
      },
      ...Object.entries(groupedFields).map(([fieldKey, fields]) => {
        const mainField = fields[0];
        const isTableFieldReadOnly = mainField.readonly === true || mainField.readonly === 1;
        
        if (fieldKey === 'sgt_shipment_id_c') {
          return {
            title: <span className="table-header-bold">Lô hàng</span>,
            dataIndex: fieldKey,
            key: fieldKey,
            align: 'center',
            ellipsis: true,
            render: (_, record) => {
              const shipment = record?.shipment_data;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 'auto' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {shipment?.import_date ? dayjs(shipment.import_date).format('DD/MM/YYYY') : '--'}
                  </span>
                  <Button
                    size="small"
                    type="link"
                    style={{ padding: 0, height: 'auto', fontSize: 12 }}
                    disabled={!isTableFieldReadOnly} // 🔥 SỬA: Bỏ dấu "!" để nút hoạt động khi không bị readonly
                    onClick={() => {
                      setSelectedRecordId(String(record.id));
                      setShipmentKeyword('');
                      setOpenShipmentModal(true);
                    }}
                  >
                    Chọn lô
                  </Button>
                </div>
              );
            }
          };
        }

        if (fieldKey === 'discount') {
          const typeField = fields.find(f => f.type === 'enum') || {};
          return {
            title: <span className="table-header-bold">Chiết khấu</span>,
            key: 'discount_group_column',
            align: 'center',
            ellipsis: true,
            render: (_, record) => {
              const type = record.discount_type_sp_c || 'direct';
              const unitPrice = Number(record.price_c || 0);
              const discountValue = Number(record.discount_sp_c || 0);
              const isOverPercent = type === 'percent' && discountValue > 100;
              const isOverMoney = type === 'direct' && discountValue > unitPrice;
              const hasError = isOverPercent || isOverMoney;
              const realDiscount = type === 'percent' ? (unitPrice * discountValue) / 100 : discountValue;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '120px', margin: '0 auto' }}>
                  <Select
                    size="small"
                    value={type}
                    style={{ width: '100%' }}
                    disabled={isTableFieldReadOnly}
                    onChange={(newType) => handleTableFieldChange(record.id, 'discount_type_sp_c', newType)}
                    options={(typeField.options || [
                      { label: 'Chiết khấu tiền', value: 'direct' },
                      { label: 'Chiết khấu %', value: 'percent' }
                    ])}
                  />
                  <InputNumber
                    size="small"
                    status={hasError ? 'error' : ''}
                    value={discountValue === 0 ? null : discountValue}
                    min={0}
                    disabled={isTableFieldReadOnly}
                    style={{ width: '100%' }}
                    placeholder={type === 'percent' ? 'Nhập %' : 'Nhập số tiền'}
                    formatter={(val) => type === 'direct' ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : val}
                    parser={(val) => (val || '').replace(/,/g, '')}
                    onChange={(val) => handleTableFieldChange(record.id, 'discount_sp_c', val)}
                  />
                  {hasError && (
                    <span style={{ color: '#ff4d4f', fontSize: 11 }}>
                      {isOverPercent ? 'Không vượt 100%' : 'Không vượt đơn giá'}
                    </span>
                  )}
                  {!hasError && (
                    <div style={{ fontSize: 10, color: '#999' }}>
                      {type === 'percent' ? `~ ${realDiscount.toLocaleString()} đ` : `${unitPrice ? ((realDiscount / unitPrice) * 100).toFixed(1) : 0}%`}
                    </div>
                  )}
                </div>
              );
            }
          };
        }

        return {
          title: <span className="table-header-bold">{cleanSystemLabel(mainField.label)}</span>,
          dataIndex: fieldKey,
          key: fieldKey,
          ellipsis: true,
          render: (v, record) => {
            if (!isTableFieldReadOnly) {
              if (mainField.type === 'enum') {
                return (
                  <Select
                    size="small"
                    style={{ width: 'auto', minWidth: '110px', maxWidth: '140px' }}
                    placeholder="Chọn..."
                    value={v}
                    onChange={(val) => handleTableFieldChange(record.id, fieldKey, val)}
                    options={(mainField.options || []).map(opt => ({ value: opt.value, label: opt.label }))}
                  />
                );
              }

              if (mainField.type === 'currency' || mainField.type === 'int' || mainField.type === 'decimal') {
                const isOriginalAmount = fieldKey === 'origin_amount';
                const isQty = fieldKey.includes('qty');
                const targetWidth = isQty ? '65px' : '100px';

                return (
                  <InputNumber
                    size="small"
                    style={{ width: targetWidth, minWidth: targetWidth }}
                    placeholder="0"
                    disabled={isOriginalAmount}
                    value={v}
                    min={0}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(val) => val.replace(/,/g, '')}
                    onChange={(val) => handleTableFieldChange(record.id, fieldKey, val)}
                  />
                );
              }

              return (
                <Input
                  size="small"
                  style={{ width: 'auto', minWidth: '120px', maxWidth: '160px' }}
                  placeholder={cleanSystemLabel(mainField.label)}
                  value={v}
                  onChange={(e) => handleTableFieldChange(record.id, fieldKey, e.target.value)}
                />
              );
            }

            if (mainField.type === 'currency' || mainField.type === 'int' || mainField.type === 'decimal') {
              return <Text style={{ fontSize: 13 }}>{v ? Number(v).toLocaleString() : '-'}</Text>;
            }
            return <Text style={{ fontSize: 13 }}>{v || '-'}</Text>;
          }
        };
      }),
      {
        title: '',
        key: 'action_delete_column',
        width: 55,
        align: 'center',
        render: (_, record, index) => (
          <Button
            danger
            size="small"
            type="text"
            style={{ fontSize: 12, padding: '0 4px' }}
            onClick={() => handleRemoveLine(index)}
          >
            Xoá
          </Button>
        )
      }
    ];
  }, [groupedFields, lineItems]);

  // --- RETURN THẲNG COMPONENT CARD (ĐÃ BỎ VÒNG LẶP .MAP THỪA) ---
  return (
    <>
      <Card
        key={panel.key}
        title={<span className="panel-title-bold">{cleanSystemLabel(panel.label)}</span>}
        style={{ marginTop: 12, borderRadius: 12 }}
        styles={{ body: { padding: '16px' } }}
      >
        {/* Ô TÌM KIẾM SẢN PHẨM */}
        <div style={{ marginBottom: 16, width: '100%' }}>
          <Select
            showSearch
            style={{ width: '100%' }}
            size="large"
            placeholder="🔍 Tìm nhanh sản phẩm theo Tên hoặc Mã SKU tại đây..."
            optionFilterProp="children"
            value={null}
            onChange={handleSelectProduct}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
              {
                value: 'prod_01',
                label: 'Sản phẩm mẫu A (SKU: SPMA)',
                product: { name: 'Sản phẩm mẫu A', sku: 'SPMA', price: 150000, shipment_data: [{ id: 'sh_01', import_date: '2026-05-10', quantity_on_hand: 100, qty_cansell: 85 }] }
              },
              {
                value: 'prod_02',
                label: 'Sản phẩm mẫu B (SKU: SPMB)',
                product: { name: 'Sản phẩm mẫu B', sku: 'SPMB', price: 230000, shipment_data: [{ id: 'sh_01', import_date: '2026-05-10', quantity_on_hand: 100, qty_cansell: 85 }] }
              },
            ]}
          />
        </div>

        {/* BẢNG SẢN PHẨM LINE ITEMS */}
        <Table
          rowKey="id"
          pagination={false}
          dataSource={lineItems}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="Vui lòng gõ vào ô tìm kiếm phía trên để thêm sản phẩm vào đơn" /> }}
          columns={columns}
        />

        {panel.line_item_source_module === 'sgt_orderdetail' ? (
          <LineItemsFooter 
            lineItems={lineItems}
            formData={formData}
            handleFormChange={handleFormChange}
          />
        ) : null}

        {/* MODAL CHỌN LÔ HÀNG DÙNG CHUNG */}
        <Modal
          open={openShipmentModal}
          footer={null}
          width={700}
          onCancel={() => setOpenShipmentModal(false)}
          title="Chọn Lô Hàng"
        >
          <Input
            placeholder={`Tìm theo ngày nhập (VD: ${dayjs().format('DD/MM/YYYY')})...`}
            style={{ marginBottom: 16 }}
            value={shipmentKeyword}
            onChange={(e) => setShipmentKeyword(e.target.value)}
          />
          <Table
            pagination={false}
            rowKey="id"
            dataSource={allShipments.filter(item => dayjs(item.import_date).format('DD/MM/YYYY').includes(shipmentKeyword))}
            columns={[
              { title: 'Ngày nhập', render: (_, item) => dayjs(item.import_date).format('DD/MM/YYYY') },
              { title: 'Tồn kho', dataIndex: 'quantity_on_hand', align: 'center' },
              {
                title: 'Có thể bán',
                dataIndex: 'qty_cansell',
                align: 'center',
                render: (v) => <span style={{ color: '#1677ff', fontWeight: 600 }}>{v}</span>
              },
              {
                title: 'Thao tác',
                align: 'center',
                render: (_, shipment) => (
                  <Button
                    type="primary"
                    shape="round"
                    style={{ backgroundColor: '#0088FF', borderColor: '#0088FF' }}
                    onClick={() => {
                      setLineItems(prev => prev.map(item => {
                        if (String(item.id) === String(selectedRecordId)) {
                          return { ...item, sgt_shipment_id_c: shipment.id, shipment_data: shipment };
                        }
                        return item;
                      }));
                      setOpenShipmentModal(false);
                    }}
                  >
                    CHỌN
                  </Button>
                )
              }
            ]}
          />
        </Modal>
      </Card>
    </>
  );
}
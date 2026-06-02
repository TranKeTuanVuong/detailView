import React, { useState, useMemo, useEffect } from 'react';
import { Card, Select, Table, Input, Modal, Button, Empty, Typography, InputNumber, Spin , message } from 'antd';
import dayjs from 'dayjs';
import { PlusCircleOutlined } from '@ant-design/icons';
import LineItemsFooter from '../components/LineItemsFooter';
import QuickSelectProductModal from '../components/QuickSelectProductModal';

const { Text } = Typography;

export default function LineItemsSection({
  panel,               
  lineItems,
  setLineItems,
  formData,            
  handleFormChange,     
  handleSelectProduct,
  handleRemoveLine,
  handleTableFieldChange,
  cleanSystemLabel,
  pricePolicyData 
}) {
  const [openShipmentModal, setOpenShipmentModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [shipmentKeyword, setShipmentKeyword] = useState('');
  
  const [productOptions, setProductOptions] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeShipments, setActiveShipments] = useState([]);
  const [openQuickSelectModal, setOpenQuickSelectModal] = useState(false);

  

  const activePolicies = Array.isArray(pricePolicyData) ? pricePolicyData : [];

  // =================================================================
  // 🔥 CHÌA KHÓA: TỰ ĐỘNG LÀM SẠCH VÀ RE-FETCH ĐỂ KHÔI PHỤC GIÁ CŨ KHI ĐỔI KHÁCH
  // =================================================================
  useEffect(() => {
    // Mỗi khi mảng chính sách giá thay đổi (chọn khách mới hoặc bỏ chọn khách thành mảng rỗng)
    // Tiến hành reset lại mảng phương án hiển thị cũ và ép nạp lại giá mới từ CRM
    setPage(1);
    setProductOptions([]);
    fetchProducts(1, searchKeyword, false);
  }, [pricePolicyData]); // 👀 Lắng nghe sự thay đổi của mảng chính sách giá

  // =================================================================
  // ĐỘNG CƠ FETCH DATA SẢN PHẨM PHÂN TRANG ĐỘNG TỪ CRM LOCAL
  // =================================================================
  const fetchProducts = async (currentPage, keyword, isLoadMore = false) => {
    if (fetchingProducts) return;
    setFetchingProducts(true);
    try {
      const apiUrl = `./index.php?entryPoint=get_products_search&module=AOS_Products&page=${currentPage}&limit=20&keyword=${encodeURIComponent(keyword)}`;
      const response = await fetch(apiUrl, { method: 'GET' });
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const formattedOptions = result.data.map(prod => {
          const firstShipment = prod.shipment_data?.[0] || {};
          const qtyOnhand = firstShipment.quantity_on_hand ?? 0;
          const qtyCansell = firstShipment.qty_cansell ?? 0;

          const cleanSearchString = `${prod.name} ${prod.part_number || prod.sku || ''} ${prod.maincode || ''}`.trim();
          
          // Kiểm tra chính sách giá đặc thù cho Search
          const matchedPolicy = activePolicies.length > 0 
            ? activePolicies.find(p => p.product_id === prod.id) 
            : null;

          return {
            value: prod.id, 
            searchValue: cleanSearchString, 
            
            label: (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '6px 0',
                borderBottom: '1px solid #f0f0f0',
                width: '100%'
              }}>
                <div style={{ marginRight: 12, display: 'flex', alignItems: 'center' }}>
                  {prod.product_image ? (
                    <img 
                      src={prod.product_image} 
                      alt="product" 
                      style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 4, border: '1px solid #e8e8e8' }} 
                    />
                  ) : (
                    <div style={{ width: 42, height: 42, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: '#bfbfbf', fontSize: 16 }}>📦</div>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: '1.4', paddingRight: 8 }}>
                  <span style={{ fontWeight: 500, color: '#0088FF', fontSize: 13, whiteSpace: 'normal' }}>
                    {prod.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {prod.part_number || prod.sku || '---'} {prod.maincode ? `| Mã: ${prod.maincode}` : ''}
                  </span>
                </div>

                <div style={{ textAlign: 'right', minWidth: '150px', lineHeight: '1.4' }}>
                  {/* 🟢 Nếu có chính sách thì hiện giá mới gạch giá cũ, ngược lại mảng rỗng thì tự động lấy giá cũ gốc */}
                  {matchedPolicy ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: 600, color: '#ff4d4f', fontSize: 13 }}>
                        {Number(matchedPolicy.custom_price).toLocaleString()} đ
                      </span>
                      <span style={{ fontSize: 11, color: '#bfbfbf', textDecoration: 'line-through' }}>
                        {Number(prod.price || 0).toLocaleString()} đ
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontWeight: 600, color: '#2f54eb', fontSize: 13 }}>
                      {Number(prod.price || 0).toLocaleString()} đ
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>
                    Tồn: <span style={{ color: '#1890ff', fontWeight: 500 }}>{qtyOnhand}</span> | Khả dụng: <span style={{ color: '#52c41a', fontWeight: 500 }}>{qtyCansell}</span>
                  </div>
                </div>
              </div>
            ),
            
            product: {
              id: prod.id, 
              name: prod.name,
              sku: prod.part_number || prod.sku || '',
              price: Number(prod.price || 0),
              image: prod.product_image || '', 
              shipment_data: prod.shipment_data || [] 
            }
          };
        });

        setProductOptions(prev => isLoadMore ? [...prev, ...formattedOptions] : formattedOptions);
        if (result.pagination) {
          setTotalPages(result.pagination.total_pages || 1);
        }
      } else {
        if (!isLoadMore) setProductOptions([]);
      }
    } catch (error) {
      console.error("Lỗi kết nối API phân trang baotram local:", error);
      if (!isLoadMore) setProductOptions([]);
    } finally {
      setFetchingProducts(false);
    }
  };

  // Trình chống nhiễu gõ phím tìm kiếm giữ nguyên cơ chế
  useEffect(() => {
    if (searchKeyword.trim() === '') return; 
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(1, searchKeyword, false);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchKeyword]);

  // --- XỬ LÝ GOM NHÓM FIELDS THEO HÀNG ---
  const normalizeFieldName = (name = '') => {
    let cleanName = name.trim();
    if (cleanName.includes('discount')) return 'discount';
    return cleanName;
  };

  const cleanLineItemName = (text) => {
    if (!text) return '';
    return text.trim().replace(/(?<=item)[a-zA-Z0-9]+(?=_c$)/, '');
  };

  const groupedFields = {};
  (panel?.fields || [])
    .filter(field => cleanLineItemName(field.name) !== 'line_item_c')
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
        const isEditable = (mainField.readonly === true || mainField.readonly === 1);

        if (fieldKey === 'product_image_c') {
          return {
            title: <span className="table-header-bold">Ảnh sản phẩm</span>,
            dataIndex: fieldKey,
            key: fieldKey,
            width: 80,
            align: 'center',
            render: (imgUrl) => imgUrl ? (
              <img 
                src={imgUrl} 
                alt="Mẫu sản phẩm" 
                style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }} 
              />
            ) : (
              <div style={{ width: 45, height: 45, backgroundColor: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: 14, margin: '0 auto' }}>🖼️</div>
            )
          };
        }

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
                  <span style={{ fontSize: 13, fontWeight: 500, color: shipment?.lot_name ? '#111' : '#999' }}>
                    {shipment?.lot_name ? `${dayjs(shipment.import_date).format('DD/MM/YYYY')}` : 'Chưa chọn lô'}
                  </span>
                  <Button
                    size="small"
                    type="link"
                    style={{ padding: 0, height: 'auto', fontSize: 12 }}
                    disabled={!isEditable} 
                    onClick={() => {
                      setSelectedRecordId(String(record.id));
                      setActiveShipments( record._all_shipments || [] ); 
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
              const unitPrice = Number(record.origin_amount || 0);
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
                    disabled={!isEditable}
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
                    disabled={!isEditable}
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
          ellipsis: mainField.type === 'varchar' ? false : true,
          
          render: (v, record) => {
            if (mainField.type === 'varchar') {
              return (
                <div style={{ 
                  width: '240px',          
                  whiteSpace: 'normal',    
                  wordBreak: 'break-word', 
                  fontSize: '13px',
                  lineHeight: '1.4',
                  fontWeight: 500,
                  textAlign: 'left'        
                }}>
                  {v || '---'}
                </div>
              );
            }

            if (isEditable) {
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
              const displayValue = (v !== undefined && v !== null && v !== '') ? Number(v).toLocaleString() : '-';
              return <Text style={{ fontSize: 13 }}>{displayValue}</Text>;
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
  }, [groupedFields]);

  // =================================================================
  // 🔥 HANDLE SELECT PRODUCT (KIỂM TRA CHÍNH SÁCH KHI CHỌN)
  // =================================================================
  const interceptedHandleSelectProduct = (productId, option) => {
    const selectedProduct = option.product || {};
    
    // Tìm xem sản phẩm có nằm trong chính sách giá đặc thù đang active không
    const matchedPolicy = activePolicies.length > 0 
      ? activePolicies.find(p => p.product_id === productId) 
      : null;

    // 🟢 Áp giá: Nếu mảng rỗng hoặc ko khớp -> Lấy giá niêm yết cũ (selectedProduct.price) gốc rực rỡ
    const targetUnitPrice = matchedPolicy ? Number(matchedPolicy.custom_price) : Number(selectedProduct.price || 0);

    setLineItems(prev => {
      const isExist = prev.some(item => item.id === productId);
      
      if (isExist) {
        let isOverStock = false;

        const updatedList = prev.map(item => {
          if (item.id !== productId) return item;
          
          const newQty = Number(item.qty_c || 0) + 1;
          const maxCanSell = Number(item.shipment_data?.qty_cansell ?? 0);

          if (newQty > maxCanSell) {
            isOverStock = true;
            message.warning(`Sản phẩm [${item.name_sp_c}] - Lô [${item.shipment_data?.lot_name || 'Mặc định'}] chỉ còn tối đa ${maxCanSell} sản phẩm khả dụng!`);
            return item; 
          }

          const discount = Number(item.discount_sp_c || 0);
          const discType = item.discount_type_sp_c || 'direct';
          
          let total = targetUnitPrice * newQty;
          if (discType === 'percent') total -= (total * discount / 100);
          else total -= (discount * newQty);

          return { 
            ...item, 
            price_c: targetUnitPrice, 
            qty_c: newQty, 
            origin_amount: total >= 0 ? total : 0 
          };
        });

        return updatedList;
      }

      const hasShipmentData = selectedProduct.shipment_data && selectedProduct.shipment_data.length > 0;
      const defaultShipment = hasShipmentData ? selectedProduct.shipment_data[0] : null;
      const firstLotCanSell = Number(defaultShipment?.qty_cansell ?? 0);

      if (!defaultShipment || firstLotCanSell <= 0) {
        message.error(`Sản phẩm [${selectedProduct.name || 'Mặt hàng'}] đã hết hàng khả dụng trong kho! Không thể lên đơn.`);
        return prev; 
      }

      return [
        ...prev,
        {
          id: productId, 
          name_sp_c: selectedProduct.name || '',
          product_image_c: selectedProduct.product_image || selectedProduct.image || '', 
          price_c: targetUnitPrice, 
          _original_price_c: Number(selectedProduct.price || 0), 
          discount_sp_c: 0,
          discount_type_sp_c: 'direct', 
          qty_c: 1, 
          sgt_shipment_id_c: defaultShipment.id, 
          shipment_data: defaultShipment, 
          _all_shipments: selectedProduct.shipment_data || [], 
          origin_amount: targetUnitPrice 
        }
      ];
    });
  };

  return (
    <>
      <Card
        key={panel?.key}
        title={<span className="panel-title-bold">{cleanSystemLabel(panel?.label)}</span>}
        style={{ marginTop: 12, borderRadius: 12 }}
        styles={{ body: { padding: '16px' } }}
      >
        <div style={{ 
          marginBottom: 16, 
          width: '100%', 
          display: 'flex',       
          alignItems: 'center',  
          gap: '12px'            
        }}>
          <div style={{ flex: 1 }}>
            <Select
              showSearch
              style={{ width: '100%' }}
              size="large"
              placeholder="🔍 Tìm theo tên, mã SKU, hoặc quét mã Barcode..."
              defaultActiveFirstOption={false}
              filterOption={false} 
              onSearch={(value) => {
                setSearchKeyword(value);
                setPage(1); 
                setProductOptions([]); 
              }} 
              onOpenChange={(open) => {
                if (open && productOptions.length === 0) {
                  setPage(1);
                  setSearchKeyword('');
                  fetchProducts(1, '', false);
                }
              }}
              onPopupScroll={(e) => {
                const { target } = e;
                if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
                  if (!fetchingProducts && page < totalPages) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchProducts(nextPage, searchKeyword, true); 
                  }
                }
              }}
              listHeight={360} 
              optionLabelProp="searchValue" 
              value={null} 
              onChange={interceptedHandleSelectProduct}
              notFoundContent={fetchingProducts ? <div style={{ textAlign: 'center', padding: '8px' }}><Spin size="small" /> Đang tra cứu tồn kho...</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy mặt hàng nào khớp!" />}
              options={productOptions} 
            />
          </div>

          <Button 
            type="dashed" 
            size="large" 
            icon={<PlusCircleOutlined />} 
            onClick={() => setOpenQuickSelectModal(true)}
            style={{ whiteSpace: 'nowrap' }} 
          >
            Chọn nhanh sản phẩm
          </Button>

          <QuickSelectProductModal
            open={openQuickSelectModal}
            onClose={() => setOpenQuickSelectModal(false)}
            currentLineItems={lineItems}
            pricePolicyData={pricePolicyData}
            onConfirm={(newFormattedItems) => {
              setLineItems(prev => {
                const filteredPrev = prev.filter(item => !newFormattedItems.some(newItem => newItem.id === item.id));
                return [...filteredPrev, ...newFormattedItems];
              });
            }}
          />
        </div>

        <Table
          rowKey="id"
          pagination={false}
          dataSource={lineItems}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="Vui lòng tra cứu sản phẩm phía trên để lên đơn hàng" /> }}
          columns={columns}
        />

        {panel?.line_item_source_module === 'sgt_orderdetail' ? (
          <LineItemsFooter 
            lineItems={lineItems}
            formData={formData}
            handleFormChange={handleFormChange}
          />
        ) : null}

        {/* MODAL CHỌN LÔ HÀNG ĐỘNG */}
        <Modal
          open={openShipmentModal}
          footer={null}
          width={750}
          onCancel={() => setOpenShipmentModal(false)}
          title="Bảng Chọn Lô Hàng Xuất Kho"
        >
          <Input
            placeholder="Gõ nhanh tìm theo Số lô, ngày nhập kho..."
            style={{ marginBottom: 16 }}
            value={shipmentKeyword}
            onChange={(e) => setShipmentKeyword(e.target.value)}
          />
          <Table
            pagination={false}
            rowKey="id"
            dataSource={activeShipments.filter(item => 
              (item.lot_name ?? '').toLowerCase().includes(shipmentKeyword.toLowerCase()) ||
              (item.import_date ?? '').toLowerCase().includes(shipmentKeyword.toLowerCase()) ||
              (item.position ?? '').toLowerCase().includes(shipmentKeyword.toLowerCase())
            )}
            columns={[
              { title: 'Tên số Lô', dataIndex: 'lot_name', fontWeight: 600 },
              { 
                title: 'Ngày nhập kho', 
                dataIndex: 'import_date', 
                render: v => v ? dayjs(v).format('DD/MM/YYYY') : '---' 
              },
              { title: 'Tồn thực tế', dataIndex: 'quantity_on_hand', align: 'center' },
              {
                title: 'Có thể xuất bán',
                dataIndex: 'qty_cansell',
                align: 'center',
                render: (v) => <span style={{ color: '#1677ff', fontWeight: 600 }}>{v}</span>
              },
              {
                title: 'Hành động',
                align: 'center',
                render: (_, shipment) => (
                  <Button
                    type="primary"
                    shape="round"
                    style={{ backgroundColor: '#0088FF', borderColor: '#0088FF', fontWeight: 500 }}
                    onClick={() => {
                      const updatedLines = lineItems.map(item => {
                        if (String(item.id) === String(selectedRecordId)) {
                          return { 
                            ...item, 
                            sgt_shipment_id_c: shipment.id, 
                            shipment_data: shipment 
                          };
                        }
                        return item;
                      });
                      setLineItems(updatedLines);
                      setOpenShipmentModal(false);
                    }}
                  >
                    ÁP DỤNG
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
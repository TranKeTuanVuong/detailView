import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Typography, Input, Select, DatePicker, Checkbox, InputNumber, Button, Spin, message } from 'antd';
import dayjs from 'dayjs';

import RelateModelSelect from '../components/RelateModelSelect';
import { DetailApi } from '../services/useApi/DetaialApi';

// Import các Subcomponents tháp cấu trúc UI vệ tinh
import FormPanels from '../components/FormPanels';
import FormPanelsSearch from '../components/FormPanelsSearch';
import FormTabs from '../components/FormTabs';
import LineItemsSection from '../components/LineItemsSection';
import PricePolicySection from '../components/PricePolicySection';
import UniversalLineItemSection from '../components/UniversalLineItemSection';
import GroupCustomerSelect from '../components/GroupCustomerSelect'; // Sửa lại đường dẫn file cho đúng thực tế

// Import CSS
import './css/EditView.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

/* ================= LABEL CLEAN ================= */
const cleanSystemLabel = (label) => {
  if (!label) return '';
  const upperLabel = label.trim().toUpperCase();
  if (upperLabel === 'LBL_ORDER_INFORMATION' || upperLabel === 'DEFAULT') return 'Thông tin đơn hàng';
  if (upperLabel === 'LBL_DETAILVIEW_PANEL1') return 'Thông tin chi tiết';
  if (upperLabel === 'LBL_ORDER_LINE_ITEMS' || upperLabel === 'LBL_EDITVIEW_PANEL1') return 'Danh sách sản phẩm';

  if (/^lbl_/i.test(label)) {
    return label
      .replace(/^LBL_/i, '')
      .replace(/^lbl_/i, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  return label;
};

/* ================= COMPONENT BIÊN DỊCH FIELD DYNAMIC ================= */
const RenderField = ({ field, value, onChange, formData: localFormData }) => {
  const labelText = cleanSystemLabel(field.label);
  const isReadOnly = field.readonly === true || field.readonly === 1;

  const commonProps = { 
    style: { width: '100%' },
    disabled: isReadOnly,
    value: (value !== undefined && value !== null) ? value : '' 
  };

  const parentFieldName = field.type === 'dynamicenum' ? field.parentenum : null;
  const targetFormData = (localFormData && Object.keys(localFormData).length > 0) ? localFormData : (window.__form_data_bridge || {});
  const parentValue = parentFieldName && targetFormData?.[parentFieldName] ? String(targetFormData[parentFieldName]).trim() : '';

  useEffect(() => {
    if (field.type === 'dynamicenum' && parentValue !== '') {
      const validChildOptions = (field.options || []).filter(opt => 
        opt.value && String(opt.value).startsWith(`${parentValue}_`)
      );
      const isCurrentValueInvalid = !value || !validChildOptions.some(opt => String(opt.value) === String(value));

      if (validChildOptions.length > 0 && isCurrentValueInvalid) {
        const firstValidValue = validChildOptions[0].value;
        const timer = setTimeout(() => {
          onChange(firstValidValue);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [parentValue, field.type, value]); 

  // 👑 GIẢI PHÁP ĐÈ KHÓA CHÍNH: Bẫy tên trường gr_cus_list trước khi lọt vào switch-case type
  if (field.name === 'gr_cus_list') {
    return (
      <GroupCustomerSelect 
        value={value} 
        onChange={onChange} 
        disabled={isReadOnly} // Đảm bảo nếu bản ghi khóa phân quyền thì Select cũng khóa theo
      />
    );
  }

  switch (field.type) {
    case 'varchar':
    case 'name':
    case 'phone':
    case 'iframe':
      return <Input placeholder={labelText} {...commonProps} onChange={(e) => onChange(e.target.value)} />;
    
    case 'relate':
    case 'flex_relate':
      return <RelateModelSelect field={field} placeholder={field.related_module_label || labelText} disabled={isReadOnly} value={value || null} onChange={onChange} />;
    
    case 'text':
    case 'address':
    case 'html':
      return <TextArea rows={2} placeholder={labelText} {...commonProps} onChange={(e) => onChange(e.target.value)} />;
    
    case 'enum':
      return (
        <Select 
          {...commonProps} 
          value={value !== undefined && value !== null && value !== '' ? value : undefined} 
          placeholder={`Chọn ${labelText}`} 
          onChange={(val) => onChange(val)} 
          options={(field.options || [])
            .filter(opt => opt.value !== '' && opt.label !== '')
            .map((i) => ({ value: i.value, label: i.label }))
          } 
        />
      );

    case 'dynamicenum': {
      const filteredOptions = (field.options || []).filter(opt => {
        if (!parentValue) return false;
        return String(opt.value).startsWith(`${parentValue}_`);
      });
      const hasParent = parentValue !== '';
      return (
        <Select 
          {...commonProps} 
          value={(value !== undefined && value !== null && value !== '') ? value : undefined} 
          placeholder={!hasParent ? `⚠️ Vui lòng chọn trường cha trước...` : `Chọn ${labelText}`} 
          disabled={isReadOnly || !hasParent}
          onChange={(val) => onChange(val)} 
          options={filteredOptions.map((i) => ({ value: i.value, label: i.label }))} 
        />
      );
    }

    case 'multienum':
      return <Select {...commonProps} value={Array.isArray(value) ? value : []} mode="multiple" placeholder={`Chọn nhiều ${labelText}`} onChange={(vals) => onChange(vals)} options={(field.options || []).map((i) => ({ value: i.value, label: i.label }))} />;
    
    case 'date':
      return <DatePicker {...commonProps} value={value ? dayjs(value, 'YYYY-MM-DD') : null} format="DD/MM/YYYY" placeholder="Chọn ngày" onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')} />;
    
    case 'datetime':
    case 'datetimecombo':
      return <DatePicker {...commonProps} value={value ? dayjs(value, 'YYYY-MM-DD HH:mm:ss') : null} showTime format="DD/MM/YYYY HH:mm" placeholder="Chọn ngày giờ" onChange={(date) => onChange(date ? date.format('YYYY-MM-DD HH:mm:ss') : '')} />;
    
    case 'currency':
    case 'decimal':
    case 'float':
    case 'int':
      return <InputNumber {...commonProps} value={value !== undefined && value !== null ? value : null} min={0} precision={field.type === 'int' ? 0 : undefined} formatter={(v) => field.type === 'currency' ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : v} parser={(v) => v.replace(/,/g, '')} onChange={(val) => onChange(val)} />;
    
    case 'bool':
      return <Checkbox {...commonProps} checked={value === 1 || value === true || value === '1'} onChange={(e) => onChange(e.target.checked ? 1 : 0)}>{labelText}</Checkbox>;
    
    default:
      return <Input placeholder={labelText} {...commonProps} onChange={(e) => onChange(e.target.value)} />;
  }
};

/* ================= MAIN CONFIG EDITVIEW ================= */
export default function EditView() {
  const {
    urls,
    layout,
    loading,
    module,
    setModule,
    setRecordId,     
    setAction,       
    setCheckAction,  
    handleLayOut
  } = DetailApi();

  // 1. ĐỌC CONFIG ĐỘNG ĐƯỢC INJECT TỪ CẦU NỐI PHP LOGIC HOOK
  const suiteConfig = useMemo(() => window.suiteCRMConfig || {}, []);

  const currentModule = suiteConfig.module || 'sgt_sale_offs'; // Fallback module nếu PHP không truyền đúng cấu hình
  const recordId = suiteConfig.recordId || ''; // Trả về rỗng chuẩn nếu là màn Tạo mới (Create)
  const isEditMode = !!(recordId && recordId.trim().length > 0); // Boolean nhận diện bối cảnh hoạt động

  // 2. STATE CHỦ LỰC QUẢN LÝ DATA BIỂU MẪU ĐỘNG
  const [formData, setFormData] = useState({});
  const [panelsData, setPanelsData] = useState({});
  const [warehouseId, setWarehouseId] = useState(null); 
  const [pricePolicyData, setPricePolicyData] = useState([]);
  const [promoType, setPromoType] = useState(null); 
  const [promoMethod, setPromoMethod] = useState(null); 

  const lineItems = panelsData['sgt_orderdetail'] || [];

  // GẮN CẦU NỐI ĐỂ ĐỒNG BỘ GIÁ TRỊ FORM CHO RENDER FIELD ĐỌC REALTIME
  window.__form_data_bridge = formData;

  const setLineItems = (newDataOrFn) => {
    handlePanelDataChange('sgt_orderdetail', newDataOrFn);
  };

  // =================================================================
  // 🔄 ĐỘNG CƠ HÚT DATA CHI TIẾT TỪ SERVER (CHỈ CHẠY CHO MÀN EDITVIEW)
  // =================================================================
  const get_universal_module_data = async (targetModule, targetRecordId) => {
    if (!targetModule || !targetRecordId || !layout) return;

    try {
      const payload = {
        module: targetModule,
        record_id: targetRecordId,
        type: 'edit' 
      };

      const response = await fetch('./index.php?entryPoint=get_universal_module_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData && resData.success) {
        console.log('✅ [DỮ LIỆU ĐỐI XỨNG EDITVIEW ĐÃ ĐỒNG BỘ]:', resData);
        setFormData(resData.parent_fields || {});

        const cleanedPanelsData = {};
        if (resData.line_items_data) {
          Object.keys(resData.line_items_data).forEach((moduleKey) => {
            const rawRows = resData.line_items_data[moduleKey] || [];
            const isDiscountQtyModule = moduleKey === 'sgt_discount_qty' || rawRows.some(
              row => (row.qty_from !== undefined || row.from_qty !== undefined)
            );

            if (isDiscountQtyModule) {
              const groupedMap = {};
              rawRows.forEach((row) => {
                const groupKey = row.aos_products_id_c || row.aos_product_categories_id_c || row.sgt_brands_id_c || 'default_group';

                if (!groupedMap[groupKey]) {
                  groupedMap[groupKey] = {
                    ...row,
                    id: groupKey, 
                    tiers: [] 
                  };
                }

                groupedMap[groupKey].tiers.push({
                  id: row.id,
                  from_qty: row.qty_from || row.from_qty || 0,
                  to_qty: row.qty_to || row.to_qty || 0,
                  discount: row.discount || 0,
                  discount_type: row.discount_type || 'percent'
                });
              });

              cleanedPanelsData[moduleKey] = Object.values(groupedMap);

            } else {
              cleanedPanelsData[moduleKey] = rawRows.map((row, idx) => ({
                ...row,
                id: row.id || `row_detail_${idx}`,
                qty_c: row.qty_c !== undefined ? row.qty_c : (row.qty || 1),
                price_c: row.price_c !== undefined ? row.price_c : (row.price || 0),
                discount_sp_c: row.discount_sp_c !== undefined ? row.discount_sp_c : (row.discount || 0),
                discount_type_sp_c: row.discount_type_sp_c || row.discount_type || 'direct',
                subtotal_c: row.subtotal_c !== undefined ? row.subtotal_c : (row.subtotal || 0)
              }));
            }
          });
        }
        
        setPanelsData(cleanedPanelsData);
        
        const foundWarehouseKey = Object.keys(resData.parent_fields || {}).find(
          k => k.includes('warehouse_id') || k.includes('warehouse_src')
        );
        if (foundWarehouseKey && resData.parent_fields[foundWarehouseKey]) {
          const val = resData.parent_fields[foundWarehouseKey];
          setWarehouseId(typeof val === 'object' ? val.id : val);
        }

      } else {
        message.error(resData?.message || 'Không thể trích xuất dữ liệu chi tiết từ máy chủ');
      }
    } catch (error) {
      console.error('❌ Lỗi định tuyến hệ thống:', error);
      message.error('Hệ thống mất kết nối với PHP API bốc dữ liệu!');
    }
  };

  // Khai báo global dự phòng để tương thích ngược với các file JS cũ của SuiteCRM nếu cần
  window.get_universal_module_data = get_universal_module_data;

  // 3. KHỞI ĐỘNG ĐIỀU PHỐI LAYOUT VÀ NẠP DỮ LIỆU ĐÚNG BỐI CẢNH MÀN HÌNH
  useEffect(() => {
    if (currentModule) {
      setModule(currentModule);
      setRecordId(recordId);
      setAction(isEditMode ? 'EditView' : 'Create');
      
      // Kích hoạt nạp layout form (Create và Edit xài chung layout 'edit')
      handleLayOut(currentModule, 'edit'); 
      
      // Phân luồng: Chỉ kéo data cũ nếu ở bối cảnh EDIT
      if (isEditMode) {
        get_universal_module_data(currentModule, recordId);
      } else {
        // Màn Create: Khởi tạo Form sạch trơn, đổ initialData từ PHP nếu có cấu hình mặc định
        setFormData(suiteConfig.initialData || {});
      }
    }
  }, [recordId, currentModule, isEditMode, layout !== null]); // Kiểm soát luồng chạy theo layout trạng thái

  // Khởi tạo mảng rỗng cho các panel con khi schema cấu trúc layout sẵn sàng
  useEffect(() => {
    if (layout?.line_items_panels) {
      const initialEmptyPanels = {};
      layout.line_items_panels.forEach(panel => {
        initialEmptyPanels[panel.line_item_source_module] = [];
      });
      setPanelsData(initialEmptyPanels);
    }
  }, [layout?.line_items_panels]);

  const handleFormChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handlePanelDataChange = (moduleKey, dataOrFn) => {
    setPanelsData(prev => {
      const currentPanelData = prev[moduleKey] || [];
      const updatedPanelData = typeof dataOrFn === 'function' ? dataOrFn(currentPanelData) : dataOrFn;
      return { ...prev, [moduleKey]: updatedPanelData };
    });
  };

  // Tự động tính toán lại dòng sản phẩm khi chính sách giá biến động
  useEffect(() => {
    if (lineItems.length === 0) return;
    
    setLineItems(prev => prev.map(item => {
      const matchedPolicy = pricePolicyData.length > 0 
        ? pricePolicyData.find(p => p.product_id === item.aos_products_id_c) 
        : null;

      const targetPrice = matchedPolicy 
        ? Number(matchedPolicy.custom_price) 
        : Number(item.subtotal_c || item.price_c || 0);

      const qty = Number(item.qty_c || 0);
      const discount = Number(item.discount_sp_c || 0);
      const discType = item.discount_type_sp_c || 'direct';

      let total = targetPrice * qty;
      if (discType === 'percent') total -= (total * discount / 100);
      else total -= (discount * qty);

      return {
        ...item,
        price_c: targetPrice,
        _original_price_c: item._original_price_c || item.price_c, 
        subtotal_c: total >= 0 ? total : 0
      };
    }));
  }, [pricePolicyData]); 

  function cleanUniversalFieldName(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') return '';
    const pattern = /^(.+)_(?!id)[a-zA-Z0-9]+(_c)$/i;
    return fieldName.replace(pattern, '$1$2');
  }

  // ĐÓNG GÓI PAYLOAD VÀ SUBMIT LƯU LÊN PHP APIS
  const handleSaveForm = async () => {
    const formattedFormData = { ...formData };
    const activePanelsAndTabs = [...(layout?.panels || []), ...(layout?.tabs || [])];
    activePanelsAndTabs.forEach(section => {
      (section.fields || []).forEach(field => {
        if ((field.type === 'relate' || field.type === 'flex_relate') && formattedFormData[field.name]) {
          const relateObj = formattedFormData[field.name];
          if (typeof relateObj === 'object') {
            const idFieldName = field.related_id_field || `${field.name}_id`;
            formattedFormData[idFieldName] = relateObj.id; 
            formattedFormData[field.name] = relateObj.name;       
          }
        }
      });
    });

    const dynamicLineItemsData = {};
    
    (layout?.line_items_panels || []).forEach(panel => {
      const moduleKey = panel.line_item_source_module;
      const rawRows = panelsData[moduleKey] || [];
      const flattenedModuleRows = [];

      rawRows.forEach(groupItem => {
        if (moduleKey === 'sgt_discount_qty' && Array.isArray(groupItem.tiers) && groupItem.tiers.length > 0) {
          groupItem.tiers.forEach(tier => {
            const cleanItem = {};

            Object.keys(groupItem).forEach(key => {
              if (key !== 'tiers' && key !== 'id' && !key.startsWith('tableRowKey')) {
                const cleanKey = typeof cleanUniversalFieldName === 'function' ? cleanUniversalFieldName(key) : key;
                cleanItem[cleanKey] = groupItem[key];
              }
            });

            cleanItem['qty_from'] = tier.from_qty;
            cleanItem['qty_to'] = tier.to_qty;
            cleanItem['discount'] = tier.discount;
            cleanItem['discount_type'] = tier.discount_type;

            (panel.fields || []).forEach(field => {
              if (field.type === 'relate' && cleanItem[field.name]) {
                const relateVal = cleanItem[field.name];
                if (typeof relateVal === 'object') {
                  const idFieldName = field.related_id_field || `${field.name}_id`;
                  cleanItem[idFieldName] = relateVal.id;
                  cleanItem[field.name] = relateVal.name;
                }
              }
            });

            const { _all_shipments, shipment_data, _original_price_c, ...finalCleanRow } = cleanItem;

            flattenedModuleRows.push({
              id: tier.id && !String(tier.id).startsWith('tier_') ? tier.id : '',
              ...finalCleanRow
            });
          });

        } else {
          const cleanItem = {};
          
          Object.keys(groupItem).forEach(key => {
            if (key === 'qty_c') cleanItem['qty'] = groupItem[key];
            else if (key === 'price_c') cleanItem['unit_price'] = groupItem[key];
            else if (key === 'discount_sp_c') cleanItem['discount'] = groupItem[key];
            else if (key === 'discount_type_sp_c') cleanItem['discount_type'] = groupItem[key];
            else if (key === 'subtotal_c') cleanItem['subtotal'] = groupItem[key];
            else {
              const cleanKey = typeof cleanUniversalFieldName === 'function' ? cleanUniversalFieldName(key) : key;
              cleanItem[cleanKey] = groupItem[key];
            }
          });

          (panel.fields || []).forEach(field => {
            if (field.type === 'relate' && cleanItem[field.name]) {
              const relateVal = cleanItem[field.name];
              if (typeof relateVal === 'object') {
                const idFieldName = field.related_id_field || `${field.name}_id`;
                cleanItem[idFieldName] = relateVal.id;
                cleanItem[field.name] = relateVal.name;
              }
            }
          });

          const { _all_shipments, shipment_data, _original_price_c, ...finalCleanRow } = cleanItem;
          
          flattenedModuleRows.push({
            id: groupItem.id && !String(groupItem.id).startsWith('row_') ? groupItem.id : '',
            ...finalCleanRow
          });
        }
      });

      dynamicLineItemsData[moduleKey] = flattenedModuleRows;
    });

    const finalPayload = {
      parent_module: layout?.module,
      parent_id: recordId, // Sẽ mang chuỗi rỗng nếu đang bấm Tạo mới để hệ thống sinh ID mới ngầm bên PHP
      parent_fields: formattedFormData,
      line_items_data: dynamicLineItemsData 
    };

    console.log("🚀 [SUBMIT PAYLOAD GỬI CRM LƯU]:", finalPayload);
    // await handleSave(finalPayload);
  };

  if (loading || !layout) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
          Đang tải cấu hình giao diện...
        </Text>
      </div>
    );
  }

  const allPanels = layout.panels || [];
  const allTabs = layout.tabs || [];
  const lineItemsPanels = layout.line_items_panels || [];
  const hasTabs = allTabs.length > 0;

  const handleRemoveLine = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleTableFieldChange = (id, fieldName, value) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      if (fieldName === 'qty_c') {
        const inputQty = Number(value || 0);
        const maxCanSell = Number(item.shipment_data?.qty_cansell ?? 0);

        if (maxCanSell > 0 && inputQty > maxCanSell) {
          message.warning(
            `Sản phẩm [${item.name_sp_c || 'Mặt hàng'}] - Lô [${item.shipment_data?.lot_name || 'Mặc định'}] chỉ còn tối đa ${maxCanSell} sản phẩm khả dụng!`
          );
          return item; 
        }
      }

      const updatedItem = { ...item, [fieldName]: value };
      const qty = Number(updatedItem.qty_c || 0);
      const price = Number(updatedItem.price_c || 0);
      const discount = Number(updatedItem.discount_sp_c || 0);
      const discType = updatedItem.discount_type_sp_c || 'direct';

      let total = price * qty;
      if (discType === 'percent') {
        total -= (total * discount / 100);
      } else {
        total -= (discount * qty);
      }
      
      updatedItem.origin_amount = total >= 0 ? total : 0;
      return updatedItem;
    }));
  };

  return (
    <div className="page" style={{ minHeight: '100vh', paddingBottom: '32px' }}>
      {/* HEADER TÁC VỤ ĐỘNG THEO TRẠNG THÁI MÀN HÌNH */}
      <div className="header">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {isEditMode ? `Chỉnh sửa ${layout.module_label || ''}` : `Tạo mới ${layout.module_label || ''}`}
          </Title>
        </div>
        <div className="header-buttons">
          <Button size="large" onClick={() => { if(urls?.url_list) window.location.href = urls.url_list; }}>Hủy</Button>
          <Button type="primary" size="large" className="btn-primary-custom" onClick={handleSaveForm}>
            {isEditMode ? 'Cập nhật' : 'Lưu bản ghi'}
          </Button>
          {urls?.url_list && (
            <Button type='default' size='large' onClick={() => (window.location.href = urls.url_list)}>
              Danh Sách
            </Button>
          )}
        </div>
      </div>

      {/* CORE WORKSPACE AREA PANEL BINDING */}
      <Row gutter={[16, 16]} className="workspace" style={{ display: 'flex', alignItems: 'stretch' }}>
        <Col xs={24} lg={hasTabs ? 17 : 24} style={{ display: 'flex', flexDirection: 'column' }}>
          {layout.module === "sgt_orders" ? (
            <FormPanelsSearch
              allPanels={allPanels}
              formData={formData}
              handleFormChange={handleFormChange}
              cleanSystemLabel={cleanSystemLabel}
              RenderField={RenderField}
              setPricePolicyData={setPricePolicyData} 
            />
          ) : (
            <FormPanels 
              allPanels={allPanels}
              formData={formData}
              handleFormChange={handleFormChange}
              cleanSystemLabel={cleanSystemLabel}
              RenderField={RenderField}
            />
          )}
        </Col>

        {hasTabs && (
          <Col xs={24} lg={7} style={{ display: 'flex', flexDirection: 'column' }}>
            <FormTabs 
              allTabs={allTabs}
              formData={formData}
              handleFormChange={handleFormChange}
              cleanSystemLabel={cleanSystemLabel}
              RenderField={RenderField}
              setWarehouseId={setWarehouseId} 
              moduleName={layout.module_label || layout.module} 
              setPromoType={setPromoType} 
              setPromoMethod={setPromoMethod} 
            />
          </Col>
        )}
      </Row>

      {/* SECTION BẢNG CON ĐỘNG SUB-GRID */}
      {layout.module === 'sgt_sale_offs' ? (
        (lineItemsPanels || []).map((panel, index) => {
          const moduleKey = panel.line_item_source_module;
          
          const selectedPromoType = formData?.promo_type;      
          const selectedMethod    = formData?.methods;         
          const selectedProdType  = formData?.promo_prod_type; 

          const isMatched = 
            (selectedMethod === 'discount_total_order' && moduleKey === 'sgt_disc_order') ||
            (selectedMethod === 'discount_by_product' && moduleKey === 'sgt_disc_product') ||
            (selectedMethod === 'discount_qty_product' && moduleKey === 'sgt_discount_qty') ||
            (selectedMethod === 'free_gifts_by_product' && moduleKey === 'sgt_gifts_by_product') ||
            (selectedMethod === 'free_gifts_total_order' && moduleKey === 'sgt_gifts_order');

          if (!isMatched) return null;

          return (
            <UniversalLineItemSection
              key={moduleKey || index}
              name={'Thêm điều kiện'}
              fields={panel.fields || []} 
              lineItemLabel={panel.line_item_source_module_label}
              dataSource={panelsData[moduleKey] || []} 
              setDataSource={(newData) => handlePanelDataChange(moduleKey, newData)} 
              isLayoutLoading={false}
              promoType={selectedPromoType}
              promoProdType={selectedProdType}
              selectedMethod={selectedMethod} 
              isDiscountQty={moduleKey === 'sgt_discount_qty'} 
            />
          );
        })
      ) : (
        (lineItemsPanels || []).map((panel, index) => {
          const moduleKey = panel.line_item_source_module;

          if (moduleKey === 'sgt_orderdetail') {
            return (
              <LineItemsSection 
                key={moduleKey || index}
                panel={panel}
                lineItems={lineItems}
                setLineItems={setLineItems}
                formData={formData}                  
                handleFormChange={handleFormChange}  
                pricePolicyData={pricePolicyData}
                handleRemoveLine={handleRemoveLine}
                handleTableFieldChange={handleTableFieldChange}
                cleanSystemLabel={cleanSystemLabel}
                warehouseId={warehouseId}
              />
            );
          } else {
            return (
              <PricePolicySection
                key={moduleKey || index}
                fields={panel.fields}
                lineItemLabel={panel.line_item_source_module_label}
                pricePolicies={panelsData[moduleKey] || []} 
                setPricePolicies={(newData) => handlePanelDataChange(moduleKey, newData)} 
                isLayoutLoading={false} 
              />
            );
          }
        })
      )}
    </div>
  );
}
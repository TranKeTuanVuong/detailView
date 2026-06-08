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

/* ================= COMPONENT ĐIỀU PHỐI FIELD RENDERER DYNAMIC ================= */
const RenderField = ({ field, value, onChange, formData: localFormData }) => {
  const labelText = cleanSystemLabel(field.label);
  const isReadOnly = field.readonly === true || field.readonly === 1;

  const commonProps = { 
    style: { width: '100%' },
    disabled: isReadOnly,
    value: (value !== undefined && value !== null) ? value : '' 
  };

  // =================================================================
  // 🔮 ĐỘNG CƠ TỰ ĐỘNG CHỌN GIÁ TRỊ ĐẦU TIÊN CHO DYNAMICENUM (ĐÃ TỐI ƯU)
  // =================================================================
  const parentFieldName = field.type === 'dynamicenum' ? field.parentenum : null;
  
  // Kiểm tra localFormData từ prop trước, nếu trống dự phòng lấy từ cầu nối toàn cục window chống mất dữ liệu
  const targetFormData = (localFormData && Object.keys(localFormData).length > 0) ? localFormData : (window.__form_data_bridge || {});
  
  const parentValue = parentFieldName && targetFormData?.[parentFieldName] 
    ? String(targetFormData[parentFieldName]).trim() 
    : '';

  useEffect(() => {
    if (field.type === 'dynamicenum' && parentValue !== '') {
      
      // Lọc danh sách cấp con chính xác tuyệt đối bằng dấu gạch dưới `_`
      const validChildOptions = (field.options || []).filter(opt => 
        opt.value && String(opt.value).startsWith(`${parentValue}_`)
      );

      // Kiểm tra xem giá trị con hiện tại trên UI có khớp với danh sách con hợp lệ của cha không
      const isCurrentValueInvalid = !value || !validChildOptions.some(opt => String(opt.value) === String(value));

      if (validChildOptions.length > 0 && isCurrentValueInvalid) {
        const firstValidValue = validChildOptions[0].value;
        
        // Hoãn lệnh gán qua setTimeout để đưa tiến trình ra sau luồng render chính của React, loại bỏ lỗi UI bị đơ
        const timer = setTimeout(() => {
          onChange(firstValidValue);
        }, 0);
        
        return () => clearTimeout(timer);
      }
    }
  }, [parentValue, field.type, value]); 

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

    // =================================================================
    // 🟢 TÁCH BIỆT XỬ LÝ DYNAMICENUM: ĐỒNG BỘ ĐIỀU KIỆN LỌC PHỤ THUỘC CHÍNH XÁC
    // =================================================================
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
export default function EditView({ recordId }) {
  const {
    urls,
    layout,
    loading,
    module,
    setModule,
    handleLayOut,
    handleSave
  } = DetailApi();

  // 1. STATE QUẢN LÝ DỮ LIỆU ĐỘNG TỔNG THỂ
  const [formData, setFormData] = useState({});
  const [panelsData, setPanelsData] = useState({});

  // 🟢 KÍCH HOẠT CẦU NỐI: Liên tục đẩy dữ liệu mới nhất lên bộ nhớ window phục vụ RenderField
  window.__form_data_bridge = formData;

  // Cầu nối tổng quản lý chính sách giá từ trang chính EditView
  const lineItems = panelsData['sgt_orderdetail'] || [];
  const [pricePolicyData, setPricePolicyData] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null); 

  const [promoType, setPromoType] = useState(null); 
  const [promoMethod, setPromoMethod] = useState(null); 

  const setLineItems = (newDataOrFn) => {
    handlePanelDataChange('sgt_orderdetail', newDataOrFn);
  };

  // 2. KHỞI TẠO MẢNG RỖNG CHO CÁC PANEL NGẪU NHIÊN KHI CẤU TRÚC LAYOUT SẴN SÀNG
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
      const updatedPanelData = typeof dataOrFn === 'function' 
        ? dataOrFn(currentPanelData) 
        : dataOrFn;
      return {
        ...prev,
        [moduleKey]: updatedPanelData
      };
    });
  };

  // =================================================================
  // 🔥 LUỒNG TỰ ĐỘNG CẬP NHẬT GIÁ KHI CHÍNH SÁCH THAY ĐỔI
  // =================================================================
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

  // =================================================================
  // ĐỘNG CƠ GOM CỤM ĐỘNG VÀ LƯU DỮ LIỆU TỔNG QUÁT LÊN APIS PHP
  // =================================================================
  function cleanUniversalFieldName(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') return '';
    const pattern = /^(.+)_(?!id)[a-zA-Z0-9]+(_c)$/i;
    return fieldName.replace(pattern, '$1$2');
  }

  const handleSaveForm = async () => {
    // 1. CHUẨN HÓA DỮ LIỆU FORM CHÍNH (Giữ nguyên logic cũ của bạn)
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

    // 2. 🔥 XỬ LÝ DỮ LIỆU BẢNG CON ĐỘNG
    const dynamicLineItemsData = {};
    
    (layout?.line_items_panels || []).forEach(panel => {
      const moduleKey = panel.line_item_source_module;
      const rawRows = panelsData[moduleKey] || []; // Mảng chứa dữ liệu dạng lồng tiers

      // Tạo một mảng chứa kết quả phẳng hóa cuối cùng cho module này
      const flattenedModuleRows = [];

      rawRows.forEach(groupItem => {
        // Kiểm tra xem dòng này có chứa mảng tiers con và có phải là module số lượng bậc thang không
        if (moduleKey === 'sgt_discount_qty' && Array.isArray(groupItem.tiers) && groupItem.tiers.length > 0) {
          
          // 🔁 CHẠY VÒNG LẶP ĐỂ GIẢI NÉN TỪNG TIER THÀNH 1 DÒNG ĐỘC LẬP
          groupItem.tiers.forEach(tier => {
            const cleanItem = {};

            // Bước A: Copy toàn bộ thuộc tính định danh từ Group cha sang dòng phẳng mới
            Object.keys(groupItem).forEach(key => {
              // Bỏ qua các key hệ thống tạm và mảng tiers lồng nhau để tránh dôi dư dữ liệu
              if (key !== 'tiers' && key !== 'id' && !key.startsWith('tableRowKey')) {
                const cleanKey = typeof cleanUniversalFieldName === 'function' ? cleanUniversalFieldName(key) : key;
                cleanItem[cleanKey] = groupItem[key];
              }
            });

            // Bước B: Đè các thông số bậc thang tĩnh của TIER này vào các cột tương ứng
            // Đồng bộ tên trường: Map từ 'from_qty'/'to_qty' của tier sang đúng tên cột 'qty_from'/'qty_to' trong DB JSON của bạn
            cleanItem['qty_from'] = tier.from_qty;
            cleanItem['qty_to'] = tier.to_qty;
            cleanItem['discount'] = tier.discount;
            cleanItem['discount_type'] = tier.discount_type;

            // Bước C: Chuẩn hóa các Object trường liên kết Relate ({id, name} -> tách ra string & _id_c)
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

            // Bước D: Tiến hành dọn dẹp các trường rác dôi dư hệ thống nếu có
            const { _all_shipments, shipment_data, _original_price_c, ...finalCleanRow } = cleanItem;

            // Đẩy bản ghi phẳng hoàn chỉnh vào mảng tổng (Mỗi tier giữ ID con độc lập nếu có, nếu là tier_ tạm của React thì truyền rỗng để tạo mới)
            flattenedModuleRows.push({
              id: tier.id && !String(tier.id).startsWith('tier_') ? tier.id : '',
              ...finalCleanRow
            });
          });

        } else {
          // 🔵 ĐỐI VỚI CÁC MODULE THƯỜNG (KHÔNG CÓ TIERS): Giữ nguyên logic map phẳng 1 dòng như cũ của bạn
          const cleanItem = {};
          
          Object.keys(groupItem).forEach(key => {
            if (key === 'qty_c') cleanItem['qty'] = groupItem[key];
            else if (key === 'price_c') cleanItem['price'] = groupItem[key];
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

      // Gán mảng đã giải nén phẳng hoàn chỉnh vào payload gửi đi
      dynamicLineItemsData[moduleKey] = flattenedModuleRows;
    });

    // 3. ĐÓNG GÓI PAYLOAD CUỐI CÙNG GỬI LÊN SERVER
    const finalPayload = {
      parent_module: layout?.module,
      parent_id: formattedFormData?.id || recordId || '', 
      parent_fields: formattedFormData,
      line_items_data: dynamicLineItemsData 
    };

    console.log("🚀 [FINAL PAYLOAD PHẲNG HOÀN TOÀN ĐÃ GIẢI NÉN TIERS]:", finalPayload);
    // await handleSave(finalPayload);
  };

  if (loading || !layout) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* 🟢 ĐÃ ĐỔI: Thay thế tip bằng description theo chuẩn AntD mới */}
        <Spin size="large" description="Đang tải cấu hình giao diện..." />
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
      {/* HEADER TÁC VỤ */}
      <div className="header">
        <div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Title level={3} style={{ margin: 0 }}>
                {layout.module_label || 'Chi tiết bản ghi'}
              </Title>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Module:</Text>
                <Input
                  placeholder="Nhập module name"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  style={{ width: 250, marginLeft: 8 }}
                />
              </div>
            </div>
            <Button type="primary" size="large" className="btn-primary-custom" onClick={() => handleLayOut(module)}>Load lại</Button>
          </div>
        </div>
        <div className="header-buttons">
          <Button size="large">Hủy</Button>
          <Button type="primary" size="large" className="btn-primary-custom" onClick={handleSaveForm}>Lưu</Button>
          {urls?.url_list && (
            <Button type='primary' size='large' className="btn-primary-custom" onClick={() => (window.location.href = urls.url_list)}>
              Danh Sách {layout.module_label || ''}
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

     {/* SECTION BẢNG CON ĐỘNG */}
      {layout.module === 'sgt_sale_offs' ? (
        // 🟢 LUỒNG 1: Dành riêng cho module Khuyến mãi (sgt_sale_offs)
        (lineItemsPanels || []).map((panel, index) => {
          const moduleKey = panel.line_item_source_module;
          
          // 1. Móc toàn bộ các giá trị đang cấu hình từ Form chính để làm điều kiện lọc
          const selectedPromoType = formData?.promo_type;      // Ô Loại khuyến mãi (discount / free_gifts)
          const selectedMethod    = formData?.methods;         // Ô Phương thức khuyến mãi
          const selectedProdType  = formData?.promo_prod_type; // Ô Loại sản phẩm áp dụng

          // 2. Kiểm tra ẩn/hiện nguyên bảng Sub-grid theo phương thức khuyến mãi
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
              // 🔥 QUAN TRỌNG: Truyền nguyên bản panel.fields gốc từ API layout sang
              // Điều này giúp hàm khởi tạo dòng mới ở file con nhận đủ key, không bị mất/rỗng data khi gửi lên CRM
              fields={panel.fields || []} 
              lineItemLabel={panel.line_item_source_module_label}
              dataSource={panelsData[moduleKey] || []} 
              setDataSource={(newData) => handlePanelDataChange(moduleKey, newData)} 
              isLayoutLoading={false}
              promoType={selectedPromoType}
              promoProdType={selectedProdType}
              selectedMethod={selectedMethod} // 🟢 Truyền thêm prop này để con lọc ẩn cột order_value
              isDiscountQty={moduleKey === 'sgt_discount_qty'} 
            />
          );
        })
      ) : (
        // 🔵 LUỒNG 2: Dành cho các module khác (Giữ nguyên vẹn)
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
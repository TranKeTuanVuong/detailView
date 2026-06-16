import React, { useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { fetchEditViewLayout, saveUniversalModuleData } from '../api/layoutApi';

export const DetailApi = () => {
  const [layout, setLayout] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [module, setModule] = useState<string>('');
  
  // Các state quản lý tham số bối cảnh hệ thống động từ URL SuiteCRM
  const [action, setAction] = useState<string>('CreateView');
  const [checkAction, setCheckAction] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);

  // =================================================================
  // 1. ĐỘNG CƠ TẠO URL ĐỘNG TỰ ĐỘNG BẪY ĐƯỜNG DẪN MÔI TRƯỜNG (Vite vs Prod)
  // =================================================================
  const generateUrls = (
    currentModule: string, 
    currentAction: string, 
    currentCheckAction: string | null, 
    currentRecordId: string | null
  ) => {
    // 🌟 KHỐI TỰ ĐỘNG ĐỊNH TUYẾN BASE URL: 
    // Nếu chạy local dev (Vite 5173) thì bắt nối thêm domain localhost, nếu nhúng thật dùng đường dẫn gốc tương đối.
    const baseUrl = window.location.port === '5173' ? 'http://localhost/baotramb1/' : './';
    
    const url_import = `${baseUrl}index.php?module=Import&action=Step1&import_module=${currentModule}&return_module=${currentModule}&return_action=index`;
    const url_list = `${baseUrl}index.php?module=${currentModule}&action=index`;
    const url_create = `${baseUrl}index.php?module=${currentModule}&action=EditView&return_module=${currentModule}&return_action=DetailView&check_action=CreateView`;
    
    const url_edit = currentRecordId 
      ? `${baseUrl}index.php?module=${currentModule}&action=EditView&record=${currentRecordId}`
      : null;

    let btn_create_active = "";
    let btn_list_active = "";
    let btn_edit_active = "";

    if (currentAction === "ListView" || currentAction === "index" || currentCheckAction === "index") {
      btn_list_active = "btn-module-active";
    }
    
    if (currentCheckAction === "CreateView" || (currentAction === "EditView" && !currentRecordId)) {
      btn_create_active = "btn-module-active";
    }

    if (currentAction === "EditView" && currentRecordId && currentCheckAction !== "CreateView") {
      btn_edit_active = "btn-module-active";
    }

    return {
      url_import,
      url_list,
      url_create,
      url_edit,
      btn_create_active,
      btn_list_active,
      btn_edit_active
    };
  };

  const urls = useMemo(() => {
    return generateUrls(module, action, checkAction, recordId);
  }, [module, action, checkAction, recordId]);

  // =================================================================
  // 🟢 2. LUỒNG TẢI LAYOUT LINH HOẠT ĐỘNG (BẬT/TẮT TỰ ĐỘNG QUA COMPONENT CHA)
  // =================================================================
  const handleLayOut = async (customModule?: string, viewType: 'edit' | 'detail' = 'edit') => {
    const targetModule = customModule || module;

    if (!targetModule) return;

    setLoading(true);
    try {
      // Bắn chính xác viewType ('edit' hoặc 'detail') sang API để bốc file def tương ứng từ PHP
      const res = await fetchEditViewLayout(targetModule, viewType);

      if (!res) {
        console.warn("Không lấy được dữ liệu layout từ API");
        return;
      }
      
      setLayout(res);
    } catch (e) {
      console.warn("Lỗi trong quá trình tải Layout:", e);
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // 3. ĐỘNG CƠ LƯU PAYLOAD LÊN SERVER CRM
  // =================================================================
  const handleSave = async (data: any) => { 
    try {
      const res = await saveUniversalModuleData(data);
      if (res && res.success) {
        message.success('Dữ liệu đã được lưu thành công!');
        return res;
      } else {
        console.warn('Lỗi khi lưu dữ liệu:', res?.message);
        message.error(res?.message || 'Lỗi khi lưu dữ liệu');
        return res;
      }
    } catch (error) { 
      console.error('Lỗi kết nối API lưu dữ liệu:', error);
      message.error('Không thể kết nối tới máy chủ lưu dữ liệu');
      throw error;
    }
  };

  return {
    urls,
    layout,
    loading,
    module,
    setModule,
    action,
    setAction,
    setCheckAction,
    recordId,
    setRecordId, // 🌟 Trả ra ngoài để file cha DetailView.jsx đồng bộ đồng loạt trị số
    handleLayOut,
    handleSave
  };
};
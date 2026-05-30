import React, { useState, useEffect, useCallback } from "react";
import dayjs from 'dayjs';
import { fetchListViewLayout } from '../api/layoutApi';
import { ListViewLayoutConfig } from '../../type/ListViewLayout.types';

export const RelateApi = (field: any) => {
  const [listview, setListView] = useState<ListViewLayoutConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pageParams, setPageParams] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Hàm lấy danh sách tên field từ JSON cấu hình nếu cần
  const getFieldNames = (layoutJson: ListViewLayoutConfig) => {
    if (!layoutJson || !layoutJson.fields) return [];
    return layoutJson.fields.map(f => f.name);
  };

  // Hàm thực thi fetch cấu hình layout và data đồng thời
  const handleListview = useCallback(async (module: string, page = 1, limit = 10, currentSearch = '') => {
    if (!module) return;
    
    try {
      setLoading(true);
      const res = await fetchListViewLayout(module, page, limit, currentSearch);
      console.log("kq========",res)
      
      if (!res || !res.success) {
        console.warn("Không lấy được dữ liệu hoặc API trả về thất bại");
        return;
      }

      // 1. Khớp cấu hình layout cột
      setListView(res.layout);

      // 2. 🔥 FIX: Đọc mảng dữ liệu trực tiếp từ lớp ngoài cùng của response (res.data)
      setDataSource(res.data || []);

      // 3. 🔥 FIX: Đọc thông tin phân trang trực tiếp từ lớp ngoài cùng (res.pagination)
      setPageParams(prev => ({
        ...prev,
        page: Number(res.pagination?.page || page),
        limit: Number(res.pagination?.limit || limit),
        total: Number(res.pagination?.total || 0)
      }));
      
    } catch (error) {
      console.warn("Lỗi thực thi fetch dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Đồng bộ hóa trigger gọi lại dữ liệu khi thay đổi trang hoặc từ khóa
  useEffect(() => {
    if (isModalOpen && field?.related_module) {
      handleListview(field.related_module, pageParams.page, pageParams.limit, searchText);
    }
  }, [isModalOpen, pageParams.page, pageParams.limit, searchText, field?.related_module, handleListview]);

  return {
    listview,
    dataSource,
    searchText,
    isModalOpen,
    pageParams,
    loading,
    getFieldNames,
    setDataSource,
    setSearchText,
    setIsModalOpen,
    setPageParams,
    handleListview
  };
};
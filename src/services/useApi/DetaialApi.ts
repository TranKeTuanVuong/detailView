import React,{useEffect,useState} from "react";
import { DatePicker, Typography } from 'antd';
import dayjs from 'dayjs';
const { Text, Title } = Typography;
import {fetchEditViewLayout,fetchListViewLayout } from '../api/layoutApi';






export const DetailApi = () => {

  const [layout, setLayout] = useState(null);
  
  const [urlParams, setUrlParams] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string>('');
  const [module,setModule] = useState('AOS_Products')
  const [recordId, setRecordId] = useState<string | null>(null);
  
  //const module='AOS_Products';
  const checkAction = '';
  const type = 'edit'





   // 1. Logic tạo URL cho các nút bấm (Chuyển từ PHP sang JavaScript)
  const generateUrls = (module: string, action: string, checkAction: string | null, recordId: string | null) => {
    const baseUrl = 'https://demo.saigongreentech.com/baotramdev/';
    
    // Các URL cơ bản
    const url_import = `${baseUrl}index.php?module=Import&action=Step1&import_module=${module}&return_module=${module}&return_action=index`;
    const url_list = `${baseUrl}index.php?module=${module}&action=index`;
    const url_create = `${baseUrl}index.php?module=${module}&action=EditView&return_module=${module}&return_action=DetailView&check_action=CreateView`;
    
    // URL Edit (Chỉ hợp lệ khi có recordId)
    const url_edit = recordId 
        ? `${baseUrl}index.php?module=${module}&action=EditView&record=${recordId}`
        : null;

    let btn_create_active = "";
    let btn_list_active = "";
    let btn_edit_active = "";

    // Logic xác định trạng thái Active
    // 1. Active nút Danh sách
    if (action === "ListView" || action === "index" || (checkAction === "index")) {
        btn_list_active = "btn-module-active";
    }
    
    // 2. Active nút Tạo mới (EditView nhưng không có recordId hoặc check_action là CreateView)
    if ((checkAction === "CreateView") || (action === "EditView" && !recordId)) {
        btn_create_active = "btn-module-active";
    }

    // 3. Active nút Chỉnh sửa (EditView và có recordId)
    if (action === "EditView" && recordId && checkAction !== "CreateView") {
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

    const urls = generateUrls(module, action, checkAction, recordId);

    

   const handleLayOut = async (customModule?: string) => {
        const mod = customModule || module;
        console.log(mod)

        if (!mod) return;

        setLoading(true);

        try {
            const res = await fetchEditViewLayout(mod, type);

            if (!res) {
            console.warn("Không lấy dữ liệu được");
            return;
            }
            console.log(res)

            setLayout(res);
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }
    };
    
    

    useEffect(() => {
        handleLayOut();
        }, []);




   
  
 





    return {
        urls,
        layout,
        loading,
        module,
        setModule,
        handleLayOut

      
       






    }
}
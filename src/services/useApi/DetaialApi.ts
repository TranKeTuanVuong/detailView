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
  const [recordId, setRecordId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = React.useState<string>('');
  const [searchCustomerValue, setSearchCustomerValue] = React.useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = React.useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<string | null>(null);
  const [orderType, setOrderType] = React.useState('banhang');
  const [orderDate, setOrderDate] = React.useState<dayjs.Dayjs | null>(null);
  const [discount, setDiscount] = React.useState<number>(0);
  const [discountType, setDiscountType] = React.useState<string>('direct');
  const [discountModalOpen, setDiscountModalOpen] =useState(false);

  const [openShipmentModal, setOpenShipmentModal] = useState(false);
 
  const [shipmentKeyword, setShipmentKeyword] = useState('');
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [srcSell,setSrcSell] = useState<string>('');

  const module='AOS_Products';
  const checkAction = '';
  const type = 'edit'





   // 1. Logic tạo URL cho các nút bấm (Chuyển từ PHP sang JavaScript)
  const generateUrls = (module: string, action: string, checkAction: string | null, recordId: string | null) => {
    const baseUrl = 'https://erp.baotram.vn/';
    
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

    

    const handleLayOut = async() => {

        setLoading(true);
        try{
        const res = await fetchEditViewLayout(module,type);


         if (!res){
            console.warn("không lấy dữ liệu được");
            
         }

         console.log(res);
         setLayout(res);


        } catch(e){
            console.warn(e);
            setLoading(false);

        }

    }
    
    useEffect(()=>{
        handleLayOut();
    },[])





   
  
 





    return {
        urls,
        layout,
        loading,
      
       






    }
}
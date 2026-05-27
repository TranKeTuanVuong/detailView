/**
 * Lấy cấu trúc layout EditView từ hệ thống SuiteCRM backend
 * @returns {Promise<Object>} Mảng dữ liệu cấu trúc panel/tabs
 */
export const fetchEditViewLayout = async (module:string,type:string) => {
  try {
    const response = await fetch(`./index.php?entryPoint=meta_layout&module=${module}&type=${type}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Layout api service error:', error);
    throw error;
  }
};

//index.php?entryPoint=relate_data&module=Accounts&page=1&limit=10
export const fetchListViewLayout = async (module:string,page=1,limit=10,currentSearch='')=>{
  try {
    const response = await fetch (`./index.php?entryPoint=relate_data&module=${module}&page=${page}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`);
    if (!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();

    
  } catch (error) {
    console.warn(error)
  }
}
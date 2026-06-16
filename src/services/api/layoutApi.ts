// const API_URL = import.meta.env.DEV
//   ? 'https://demo.saigongreentech.com/baotramdev'
//   : 'https://demo.saigongreentech.com/baotramdev';

  const API_URL = import.meta.env.DEV
  ? ''
  : 'http://localhost/baotramb1';


/**
 * Lấy cấu trúc layout EditView
 */
export const fetchEditViewLayout = async (
  module: string,
  type: string
) => {
  try {
   
    const response = await fetch(
      `${API_URL}/index.php?entryPoint=meta_layout&module=${module}&type=${type}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Layout api service error:', error);
    throw error;
  }
};

/**
 * List view
 */
export const fetchListViewLayout = async (
  module: string,
  page = 1,
  limit = 10,
  currentSearch = ''
) => {
  try {
    const response = await fetch(
      `${API_URL}/index.php?entryPoint=relate_data&module=${module}&page=${page}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(error);
    throw error;
  }
};


export const saveUniversalModuleData = async (payload: any) => {
  try{
      const response = await fetch('index.php?entryPoint=save_universal_module_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
   const result = await response.json();
   return result;
  }catch(error){
    console.warn(error);
    throw error;
  }
}
import axiosInstance from "../core/axios";

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

const UnitService = {
  async getAll() {
    const response = await axiosInstance.get("/units");
    return response.data;
  },
  
  async create(data: { name: string; abbreviation: string }) {
    const response = await axiosInstance.post("/units", data);
    return response.data;
  }
};

export default UnitService;

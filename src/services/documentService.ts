import api from "./api";

export const uploadDocuments = async (formData: FormData) => {
  return api.post("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

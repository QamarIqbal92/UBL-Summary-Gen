import api from "./api";

export const uploadDocuments = async (formData: FormData) => {
  return api.post("upload_docs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

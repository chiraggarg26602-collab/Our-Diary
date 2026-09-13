export async function uploadImages(files: File[]): Promise<string[]> {
  const getSignature = async () => {
    const res = await fetch('/api/cloudinary-signature');
    const data = await res.json().catch(() => ({ error: 'Invalid server response' }));
    
    if (!res.ok) {
      throw new Error(data.error || `Server error: ${res.statusText}`);
    }
    return data;
  };

  const uploadFile = async (file: File) => {
    const { signature, timestamp, apiKey, cloudName, uploadPreset } = await getSignature();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('upload_preset', uploadPreset);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }
    return data.secure_url;
  };

  const uploadPromises = Array.from(files).map(uploadFile);
  return Promise.all(uploadPromises);
}

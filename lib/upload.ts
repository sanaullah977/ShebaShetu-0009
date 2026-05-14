"use server"

export async function uploadToImgBB(base64Image: string) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error("IMGBB_API_KEY is not set");
    return null;
  }

  // Remove the data:image/jpeg;base64, part if it exists
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const formData = new FormData();
    formData.append("image", base64Data);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      console.error("ImgBB upload failed:", data.error);
      return null;
    }
  } catch (error) {
    console.error("ImgBB upload error:", error);
    return null;
  }
}

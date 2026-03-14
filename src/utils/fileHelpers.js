export const getFileType = (mimeType) => {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	if (mimeType.includes("pdf")) return "pdf";
	if (mimeType.includes("sheet") || mimeType.includes("excel")) return "excel";
	if (mimeType.includes("document") || mimeType.includes("word")) return "word";
	return "text";
};

export const fileToBase64 = (file) => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			const base64 = reader.result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = (error) => reject(error);
	});
};

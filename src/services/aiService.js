const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const callGeminiAPI = async (
	prompt,
	imageBase64 = null,
	mimeType = null,
) => {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

	const parts = [{ text: prompt }];

	if (imageBase64 && mimeType) {
		parts.push({
			inlineData: {
				mimeType: mimeType,
				data: imageBase64,
			},
		});
	}

	const payload = {
		contents: [{ parts: parts }],
	};

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (data.error) throw new Error(data.error.message);
		return (
			data.candidates?.[0]?.content?.parts?.[0]?.text ||
			"No response generated."
		);
	} catch (error) {
		console.error("Gemini API Error:", error);
		return "I couldn't process that request right now. Please try again.";
	}
};

export const callImagenAPI = async (prompt) => {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;

	const payload = {
		instances: [{ prompt: prompt }],
		parameters: { sampleCount: 1 },
	};

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const data = await response.json();
		if (data.error) throw new Error(data.error.message);

		const base64 = data.predictions?.[0]?.bytesBase64Encoded;
		if (!base64) throw new Error("No image generated");

		return `data:image/png;base64,${base64}`;
	} catch (error) {
		console.error("Imagen API Error:", error);
		throw error;
	}
};

import {
	FileText,
	Folder,
	Image as ImageIcon,
	Music,
	Video,
} from "lucide-react";

const FileIcon = ({ type, fileType, className = "w-6 h-6", previewUrl }) => {
	if (type === "folder")
		return <Folder className={`${className} text-blue-500 fill-blue-500/20`} />;

	if (fileType === "image" && previewUrl) {
		return (
			<div className={`${className} relative overflow-hidden rounded`}>
				<img
					src={previewUrl}
					alt="preview"
					className="w-full h-full object-cover"
				/>
			</div>
		);
	}

	switch (fileType) {
		case "image":
			return <ImageIcon className={`${className} text-purple-500`} />;
		case "video":
			return <Video className={`${className} text-red-500`} />;
		case "audio":
			return <Music className={`${className} text-yellow-500`} />;
		case "pdf":
			return <FileText className={`${className} text-red-600`} />;
		case "excel":
			return <FileText className={`${className} text-green-600`} />;
		case "word":
			return <FileText className={`${className} text-blue-600`} />;
		default:
			return <FileText className={`${className} text-gray-500`} />;
	}
};

export default FileIcon;

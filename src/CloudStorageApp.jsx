import {
	Album,
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Bell,
	Bot,
	Camera,
	Check,
	CheckCircle2,
	ChevronRight,
	Clock,
	Cloud,
	Database,
	Download,
	Edit2,
	Eye,
	EyeOff,
	FileText,
	Film,
	Folder,
	FolderInput,
	FolderPlus,
	Grid,
	Home,
	Image as ImageIcon,
	List,
	Loader2,
	Lock,
	LogOut,
	Mail,
	Moon,
	Music,
	Plus,
	RefreshCcw,
	Search,
	Send,
	Server,
	Settings,
	Share2,
	Shield,
	Sparkles,
	Star,
	Trash2,
	User,
	Video,
	Wand2,
	X,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";

// --- Utility Functions ---

const formatSize = (bytes) => {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

const getFileType = (mimeType) => {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	if (mimeType.includes("pdf")) return "pdf";
	if (mimeType.includes("sheet") || mimeType.includes("excel")) return "excel";
	if (mimeType.includes("document") || mimeType.includes("word")) return "word";
	return "text";
};

const getInitials = (name) => {
	if (!name) return "U";
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
};

// --- Gemini & Imagen API Helper ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const callGeminiAPI = async (prompt, imageBase64 = null, mimeType = null) => {
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

const callImagenAPI = async (prompt) => {
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

const fileToBase64 = (file) => {
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

// --- Initial Mock Data ---

const MOCK_FILES_INITIAL = [
	{
		id: "1",
		parentId: null,
		name: "Documents",
		type: "folder",
		size: "--",
		date: "2023-10-24",
		starred: true,
		isTrashed: false,
	},
	{
		id: "2",
		parentId: null,
		name: "Images",
		type: "folder",
		size: "--",
		date: "2023-11-02",
		starred: false,
		isTrashed: false,
	},
	{
		id: "3",
		parentId: null,
		name: "Work Projects",
		type: "folder",
		size: "--",
		date: "2023-09-15",
		starred: true,
		isTrashed: false,
	},
	{
		id: "4",
		parentId: null,
		name: "Budget_2024.xlsx",
		type: "file",
		fileType: "excel",
		size: "24 KB",
		date: "2023-12-01",
		starred: false,
		isTrashed: false,
	},
	{
		id: "5",
		parentId: null,
		name: "Resume.pdf",
		type: "file",
		fileType: "pdf",
		size: "450 KB",
		date: "2024-01-10",
		starred: true,
		isTrashed: false,
	},
	{
		id: "6",
		parentId: "1",
		name: "Notes.txt",
		type: "file",
		fileType: "text",
		size: "2 KB",
		date: "2023-10-25",
		starred: false,
		isTrashed: false,
	},
	{
		id: "7",
		parentId: "1",
		name: "Report.docx",
		type: "file",
		fileType: "word",
		size: "1.2 MB",
		date: "2023-10-26",
		starred: false,
		isTrashed: false,
	},
	{
		id: "8",
		parentId: "2",
		name: "Vacation",
		type: "folder",
		size: "--",
		date: "2023-11-05",
		starred: false,
		isTrashed: false,
	},
	{
		id: "9",
		parentId: "2",
		name: "Profile_Pic.jpg",
		type: "file",
		fileType: "image",
		size: "2.4 MB",
		date: "2023-11-02",
		starred: false,
	},
	{
		id: "10",
		parentId: "8",
		name: "Beach.png",
		type: "file",
		fileType: "image",
		size: "3.1 MB",
		date: "2023-11-05",
		starred: false,
	},
];

const MOCK_ALBUMS_INITIAL = [
	{ id: "alb1", name: "Vacation 2023", coverId: "10", fileIds: ["10"] },
];

const SIDEBAR_ITEMS = [
	{ id: "my-files", icon: Home, label: "My Files" },
	{ id: "recent", icon: Clock, label: "Recent" },
	{ id: "gallery", icon: ImageIcon, label: "Gallery" },
	{ id: "starred", icon: Star, label: "Starred" },
	{ id: "trash", icon: Trash2, label: "Trash" },
];

// --- Sub-Components ---

const LoginScreen = ({ onLogin }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [view, setView] = useState("login");
	const [isLoading, setIsLoading] = useState(false);
	const [resetSent, setResetSent] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		setIsLoading(true);
		setTimeout(() => {
			if (view === "login") {
				onLogin(email);
			} else {
				setResetSent(true);
				setIsLoading(false);
			}
		}, 1500);
	};

	if (view === "forgot") {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all">
					<div className="text-center mb-8">
						<div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<RefreshCcw className="w-8 h-8 text-indigo-600" />
						</div>
						<h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
						<p className="text-gray-500 mt-2">
							Enter your email to receive reset instructions
						</p>
					</div>

					{!resetSent ? (
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label
									htmlFor="reset-email"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Email Address
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<Mail className="h-5 w-5 text-gray-400" />
									</div>
									<input
										id="reset-email"
										type="email"
										required
										className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
										placeholder="you@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<span>Send Reset Link</span>
								)}
							</button>

							<button
								type="button"
								onClick={() => setView("login")}
								className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
							>
								Back to Login
							</button>
						</form>
					) : (
						<div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
							<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Check className="w-6 h-6 text-green-600" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Check your email
							</h3>
							<p className="text-gray-500 text-sm mb-6">
								We've sent a password reset link to{" "}
								<span className="font-medium text-gray-700">{email}</span>
							</p>
							<button
								onClick={() => {
									setView("login");
									setResetSent(false);
								}}
								className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-xl font-medium transition-colors"
							>
								Return to Login
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all">
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
						<Cloud className="w-10 h-10 text-white fill-current" />
					</div>
					<h2 className="text-3xl font-bold text-gray-900 tracking-tight">
						Welcome Back
					</h2>
					<p className="text-gray-500 mt-2">
						Sign in to access your cloud storage
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="login-email"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Email Address
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Mail className="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="login-email"
								type="email"
								required
								className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
					</div>

					<div>
						<div className="flex justify-between items-center mb-2">
							<label
								htmlFor="login-password"
								className="block text-sm font-medium text-gray-700"
							>
								Password
							</label>
							<button
								type="button"
								onClick={() => setView("forgot")}
								className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
							>
								Forgot Password?
							</button>
						</div>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Lock className="h-5 w-5 text-gray-400" />
							</div>
							<input
								id="login-password"
								type={showPassword ? "text" : "password"}
								required
								className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
					>
						{isLoading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							<>
								<span>Sign In</span> <ArrowRight className="w-5 h-5" />
							</>
						)}
					</button>
				</form>

				<div className="mt-8 text-center text-sm text-gray-500">
					<p>Protected by secure encryption.</p>
				</div>
			</div>
		</div>
	);
};

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

const Breadcrumbs = ({ path, onNavigate, darkMode }) => (
	<div
		className={`flex items-center space-x-2 text-sm overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide ${darkMode ? "text-gray-400" : "text-gray-600"}`}
	>
		<button
			onClick={() => onNavigate(null)}
			className={`px-2 py-1 rounded transition-colors flex items-center ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
		>
			<Home className="w-4 h-4 mr-1" />
			Home
		</button>
		{path.map((folder, index) => (
			<React.Fragment key={folder.id}>
				<ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
				<button
					onClick={() => onNavigate(folder)}
					className={`px-2 py-1 rounded transition-colors max-w-[150px] truncate ${
						index === path.length - 1
							? `font-semibold pointer-events-none ${darkMode ? "text-white" : "text-gray-900"}`
							: `${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`
					}`}
				>
					{folder.name}
				</button>
			</React.Fragment>
		))}
	</div>
);

// --- Main Application ---

export default function CloudStorageApp() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [files, setFiles] = useState(MOCK_FILES_INITIAL);
	const [albums, setAlbums] = useState(MOCK_ALBUMS_INITIAL);
	const [currentFolder, setCurrentFolder] = useState(null);
	const [currentAlbum, setCurrentAlbum] = useState(null);
	const [path, setPath] = useState([]);
	const [viewMode, setViewMode] = useState("grid");
	const [activeSidebar, setActiveSidebar] = useState("my-files");
	const [galleryTab, setGalleryTab] = useState("photos");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [previewPaneOpen, setPreviewPaneOpen] = useState(true);

	// AI State
	const [aiResponse, setAiResponse] = useState("");
	const [isAiLoading, setIsAiLoading] = useState(false);
	const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);
	const [aiSearchQuery, setAiSearchQuery] = useState("");
	const [aiSearchResponse, setAiSearchResponse] = useState("");
	const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
	const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
	const [generationType, setGenerationType] = useState("image");
	const [generationPrompt, setGenerationPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);

	// User & Settings State
	const [userProfile, setUserProfile] = useState({
		name: "John Doe",
		email: "john.doe@example.com",
		storageUsed: 0, // Initial 0, will fetch
		storageLimit: 0, // Initial 0, will fetch
		notifications: true,
		darkMode: false,
		avatar: null, // Stores image URL
	});

	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
	const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
	const [previewFile, setPreviewFile] = useState(null);
	const [renameItem, setRenameItem] = useState(null);

	// Delete Confirmation State
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

	// Toast Notification State
	const [toastMessage, setToastMessage] = useState(null);

	const [newFolderName, setNewFolderName] = useState("");
	const [newAlbumName, setNewAlbumName] = useState("");
	const [renameValue, setRenameValue] = useState("");
	const [moveTargetId, setMoveTargetId] = useState(null);

	const fileInputRef = useRef(null);
	const profilePicInputRef = useRef(null);

	const [settingsForm, setSettingsForm] = useState(userProfile);
	const [activeSettingsTab, setActiveSettingsTab] = useState("account");

	// --- Handlers ---

	const showToast = (message) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const handleCloudImport = (provider) => {
		setIsUploadModalOpen(false);
		showToast(`Connecting to ${provider}...`);

		// Simulate network request and import
		setTimeout(() => {
			const newFile = {
				id: Math.random().toString(36).substr(2, 9),
				parentId: currentFolder,
				name: `${provider}_Import_Doc_${Math.floor(Math.random() * 1000)}.pdf`,
				type: "file",
				fileType: "pdf",
				size: "4.2 MB",
				date: new Date().toISOString().split("T")[0],
				starred: false,
				isTrashed: false,
				previewUrl: null,
			};
			setFiles((prev) => [...prev, newFile]);
			showToast(`Successfully imported file from ${provider}`);
		}, 2500);
	};

	const handleLogin = (email) => {
		const name = email.split("@")[0] || "User";
		const baseProfile = { ...userProfile, email, name };
		setUserProfile(baseProfile);
		setSettingsForm(baseProfile);
		setIsLoggedIn(true);
	};

	const handleLogout = () => {
		setIsLoggedIn(false);
		setIsSettingsOpen(false);
		setActiveSidebar("my-files");
		setCurrentFolder(null);
		setPath([]);
	};

	const handleNavigate = (folder) => {
		if (folder === null) {
			setPath([]);
			setCurrentFolder(null);
		} else {
			const index = path.findIndex((f) => f.id === folder.id);
			if (index !== -1) {
				setPath(path.slice(0, index + 1));
			} else {
				setPath([...path, folder]);
			}
			setCurrentFolder(folder.id);
		}
		setSelectedIds(new Set());
		setCurrentAlbum(null);
	};

	const handleFolderClick = (folder) => {
		if (activeSidebar === "trash") return;
		setPath([...path, folder]);
		setCurrentFolder(folder.id);
		setSelectedIds(new Set());
		setActiveSidebar("my-files");
		setSearchQuery("");
		setCurrentAlbum(null);
	};

	const handleAlbumClick = (album) => {
		setCurrentAlbum(album);
		setSelectedIds(new Set());
		setSearchQuery("");
	};

	const handleSidebarClick = (id) => {
		setActiveSidebar(id);
		if (id === "my-files") {
			setCurrentFolder(null);
			setPath([]);
			setCurrentAlbum(null);
		} else if (id === "gallery") {
			setGalleryTab("photos");
			setCurrentAlbum(null);
		} else {
			setCurrentFolder(null);
			setPath([]);
			setCurrentAlbum(null);
		}
		setSelectedIds(new Set());
	};

	const handleGalleryTabChange = (tab) => {
		setGalleryTab(tab);
		setCurrentAlbum(null);
		setSelectedIds(new Set());
	};

	const toggleSelection = (e, id) => {
		e.stopPropagation();
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedIds(newSelected);
	};

	const selectSingle = (id) => {
		setSelectedIds(new Set([id]));
		setPreviewPaneOpen(true);
		setAiResponse("");
	};

	const handleFileUpload = (e) => {
		const uploadedFiles = Array.from(e.target.files);
		if (uploadedFiles.length === 0) return;

		const newFiles = uploadedFiles.map((file) => ({
			id: Math.random().toString(36).substr(2, 9),
			parentId: currentFolder,
			name: file.name,
			type: "file",
			fileType: getFileType(file.type),
			size: formatSize(file.size),
			date: new Date().toISOString().split("T")[0],
			starred: false,
			isTrashed: false,
			previewUrl:
				file.type.startsWith("image/") || file.type.startsWith("video/")
					? URL.createObjectURL(file)
					: null,
			rawFile: file,
		}));

		setFiles((prev) => [...prev, ...newFiles]);
		setIsUploadModalOpen(false);
	};

	const createFolder = () => {
		if (!newFolderName.trim()) return;
		const newFolder = {
			id: Math.random().toString(36).substr(2, 9),
			parentId: currentFolder,
			name: newFolderName,
			type: "folder",
			size: "--",
			date: new Date().toISOString().split("T")[0],
			starred: false,
			isTrashed: false,
		};
		setFiles((prev) => [...prev, newFolder]);
		setNewFolderName("");
		setIsCreateFolderOpen(false);
	};

	const createAlbum = () => {
		if (!newAlbumName.trim()) return;
		const newAlbum = {
			id: Math.random().toString(36).substr(2, 9),
			name: newAlbumName,
			coverId: null,
			fileIds: [],
		};
		setAlbums([...albums, newAlbum]);
		setNewAlbumName("");
		setIsCreateAlbumOpen(false);
	};

	const addToAlbum = (albumId) => {
		const selectedFiles = Array.from(selectedIds);
		setAlbums(
			albums.map((alb) => {
				if (alb.id === albumId) {
					const newFileIds = [...new Set([...alb.fileIds, ...selectedFiles])];
					const coverId = alb.coverId || selectedFiles[0];
					return { ...alb, fileIds: newFileIds, coverId };
				}
				return alb;
			}),
		);
		setIsAddToAlbumOpen(false);
		setSelectedIds(new Set());
	};

	const handleRename = () => {
		if (!renameValue.trim() || !renameItem) return;
		setFiles(
			files.map((f) =>
				f.id === renameItem.id ? { ...f, name: renameValue } : f,
			),
		);
		setRenameItem(null);
		setRenameValue("");
	};

	const moveToTrash = () => {
		// If called from Preview Pane (activeFile but no selectedIds), handle activeFile
		if (selectedIds.size === 0 && activeFile) {
			setFiles(
				files.map((f) =>
					f.id === activeFile.id
						? { ...f, isTrashed: true, starred: false }
						: f,
				),
			);
			setPreviewPaneOpen(false); // Close preview after deleting
		} else {
			setFiles(
				files.map((f) =>
					selectedIds.has(f.id) ? { ...f, isTrashed: true, starred: false } : f,
				),
			);
		}
		setSelectedIds(new Set());
	};

	const openMoveModal = () => {
		setMoveTargetId(null); // Default to root
		setIsMoveModalOpen(true);
	};

	const handleMoveFiles = () => {
		const filesToMove =
			selectedIds.size > 0
				? Array.from(selectedIds)
				: activeFile
					? [activeFile.id]
					: [];

		if (filesToMove.length === 0) return;

		setFiles(
			files.map((f) => {
				if (filesToMove.includes(f.id)) {
					return { ...f, parentId: moveTargetId };
				}
				return f;
			}),
		);

		setIsMoveModalOpen(false);
		setSelectedIds(new Set());
		setPreviewPaneOpen(false); // Close preview just in case
		showToast(
			filesToMove.length === 1
				? "File moved successfully"
				: "Files moved successfully",
		);
	};

	const restoreFromTrash = () => {
		setFiles(
			files.map((f) =>
				selectedIds.has(f.id) ? { ...f, isTrashed: false } : f,
			),
		);
		setSelectedIds(new Set());
	};

	const deletePermanently = () => {
		setFiles(files.filter((f) => !selectedIds.has(f.id)));
		setSelectedIds(new Set());
	};

	const confirmEmptyTrash = () => {
		setFiles(files.filter((f) => !f.isTrashed));
		setIsDeleteConfirmOpen(false);
		showToast("Trash emptied successfully");
	};

	const toggleStar = (e, id) => {
		e.stopPropagation();
		setFiles(
			files.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)),
		);
	};

	const saveSettings = () => {
		setUserProfile(settingsForm);
		setIsSettingsOpen(false);
		showToast("Settings saved successfully!");
	};

	const handleProfilePicUpdate = (e) => {
		const file = e.target.files[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setSettingsForm({ ...settingsForm, avatar: url });
		}
	};

	const handleAISummary = async (file) => {
		if (!file) return;
		setIsAiLoading(true);
		setAiResponse("");

		let prompt = "";

		if (file.rawFile && file.fileType === "text") {
			const text = await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (e) => resolve(e.target.result);
				reader.onerror = () => resolve("");
				reader.readAsText(file.rawFile);
			});
			prompt = `Summarize this text file content: \n\n${text.slice(0, 5000)}`;
		} else {
			prompt = `I have a file named "${file.name}" of type "${file.fileType}". Imagine what valuable information this file might contain and generate a helpful 3-bullet point summary of its hypothetical contents. Keep it professional.`;
		}

		const response = await callGeminiAPI(prompt);
		setAiResponse(response);
		setIsAiLoading(false);
	};

	const handleAIAnalyzeImage = async (file) => {
		if (!file) return;
		setIsAiLoading(true);
		setAiResponse("");

		if (file.rawFile) {
			try {
				const base64 = await fileToBase64(file.rawFile);
				const response = await callGeminiAPI(
					"Analyze this image. Describe what you see and suggest 3 relevant tags.",
					base64,
					file.rawFile.type,
				);
				setAiResponse(response);
			} catch (_e) {
				setAiResponse("Failed to process image.");
			}
		} else {
			const prompt = `I have an image file named "${file.name}". Generate a creative visual description of what this image might look like based on its name.`;
			const response = await callGeminiAPI(prompt);
			setAiResponse(response);
		}
		setIsAiLoading(false);
	};

	const handleGlobalAskAI = async () => {
		if (!aiSearchQuery.trim()) return;
		setIsAiSearchLoading(true);
		setAiSearchResponse("");

		const fileList = files
			.map((f) => `- ${f.name} (${f.fileType}, ${f.date})`)
			.join("\n");
		const prompt = `
        You are a smart file assistant. Here is a list of files in the user's cloud storage:
        ${fileList}

        User Query: "${aiSearchQuery}"

        Please answer the user's query based on the file list. 
        If they ask for specific files, list them. 
        If they ask for a summary of their storage (e.g., "What work files do I have?"), categorize and summarize based on file names and types.
        Keep it concise and helpful.
      `;

		const response = await callGeminiAPI(prompt);
		setAiSearchResponse(response);
		setIsAiSearchLoading(false);
	};

	const handleGeneration = async () => {
		if (!generationPrompt.trim()) return;
		setIsGenerating(true);

		try {
			if (generationType === "image") {
				const imageDataUrl = await callImagenAPI(generationPrompt);

				const newFile = {
					id: Math.random().toString(36).substr(2, 9),
					parentId: currentFolder,
					name: `AI_Gen_${Date.now()}.png`,
					type: "file",
					fileType: "image",
					size: "1.2 MB",
					date: new Date().toISOString().split("T")[0],
					starred: false,
					isTrashed: false,
					previewUrl: imageDataUrl,
				};
				setFiles((prev) => [...prev, newFile]);
				setIsGenerateModalOpen(false);
				setGenerationPrompt("");
			} else {
				await new Promise((resolve) => setTimeout(resolve, 3000));
				const newFile = {
					id: Math.random().toString(36).substr(2, 9),
					parentId: currentFolder,
					name: `AI_Video_${Date.now()}.mp4`,
					type: "file",
					fileType: "video",
					size: "15.4 MB",
					date: new Date().toISOString().split("T")[0],
					starred: false,
					isTrashed: false,
					previewUrl: null,
				};
				setFiles((prev) => [...prev, newFile]);
				setIsGenerateModalOpen(false);
				setGenerationPrompt("");
				alert("Video generation simulated! File added.");
			}
		} catch (error) {
			alert(`Generation failed: ${error.message}`);
		} finally {
			setIsGenerating(false);
		}
	};

	const downloadFile = (file) => {
		let url = file.previewUrl;
		let shouldRevoke = false;

		if (!url) {
			if (file.rawFile) {
				url = URL.createObjectURL(file.rawFile);
				shouldRevoke = true;
			} else {
				const content = `This is the mock content for ${file.name}.\n\nFile Type: ${file.fileType}\nSize: ${file.size}\nDate: ${file.date}`;
				const blob = new Blob([content], { type: "text/plain" });
				url = URL.createObjectURL(blob);
				shouldRevoke = true;
			}
		}

		const a = document.createElement("a");
		a.href = url;
		a.download = file.name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		if (shouldRevoke) {
			setTimeout(() => URL.revokeObjectURL(url), 100);
		}
	};

	const handleDownload = () => {
		const selectedFiles = files.filter(
			(f) => selectedIds.has(f.id) && f.type === "file",
		);
		if (selectedFiles.length === 0) return;
		selectedFiles.forEach(downloadFile);
	};

	const displayedItems = useMemo(() => {
		let items = files;

		if (searchQuery) {
			items = items.filter((item) =>
				item.name.toLowerCase().includes(searchQuery.toLowerCase()),
			);
			if (activeSidebar !== "trash") {
				items = items.filter((i) => !i.isTrashed);
			} else {
				items = items.filter((i) => i.isTrashed);
			}
			return items;
		}

		if (activeSidebar === "trash") {
			return items.filter((item) => item.isTrashed);
		}

		if (activeSidebar === "gallery") {
			if (galleryTab === "albums" && currentAlbum) {
				return items.filter(
					(item) => !item.isTrashed && currentAlbum.fileIds.includes(item.id),
				);
			}
			return items.filter(
				(item) =>
					!item.isTrashed &&
					(item.fileType === "image" || item.fileType === "video"),
			);
		}

		items = items.filter((item) => !item.isTrashed);

		if (activeSidebar === "recent") {
			return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
		}

		if (activeSidebar === "starred") {
			return items.filter((item) => item.starred);
		}

		return items.filter((item) => item.parentId === currentFolder);
	}, [
		files,
		currentFolder,
		activeSidebar,
		searchQuery,
		galleryTab,
		currentAlbum,
	]);

	const activeFile = useMemo(() => {
		if (selectedIds.size === 1) {
			const id = Array.from(selectedIds)[0];
			return files.find((f) => f.id === id);
		}
		return null;
	}, [selectedIds, files]);

	// Available folders for "Move To" modal (simple flat list, excluding trashed and self if selected)
	const availableFolders = useMemo(() => {
		return files.filter(
			(f) => f.type === "folder" && !f.isTrashed && !selectedIds.has(f.id),
		);
	}, [files, selectedIds]);

	const bgMain = userProfile.darkMode ? "bg-gray-900" : "bg-gray-50";
	const bgPanel = userProfile.darkMode ? "bg-gray-800" : "bg-white";
	const textMain = userProfile.darkMode ? "text-white" : "text-gray-900";
	const textSec = userProfile.darkMode ? "text-gray-400" : "text-gray-500";
	const borderCol = userProfile.darkMode
		? "border-gray-700"
		: "border-gray-200";
	const hoverBg = userProfile.darkMode
		? "hover:bg-gray-700"
		: "hover:bg-gray-50";
	const itemBg = userProfile.darkMode ? "bg-gray-800" : "bg-white";
	const itemBorder = userProfile.darkMode
		? "border-gray-700"
		: "border-gray-100";

	if (!isLoggedIn) {
		return <LoginScreen onLogin={handleLogin} />;
	}

	return (
		<div
			className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${bgMain} ${textMain}`}
		>
			{/* Toast Notification */}
			{toastMessage && (
				<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[80] bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-300">
					<CheckCircle2 className="w-5 h-5 text-green-400" />
					<span className="font-medium text-sm">{toastMessage}</span>
				</div>
			)}

			{/* Sidebar */}
			<aside
				className={`w-64 flex-shrink-0 border-r flex flex-col transition-all duration-300 hidden md:flex ${bgPanel} ${borderCol}`}
			>
				<div className="p-4 flex items-center space-x-3 text-indigo-600">
					<Cloud className="w-8 h-8 fill-current" />
					<span className={`text-xl font-bold tracking-tight ${textMain}`}>
						CloudDrive
					</span>
				</div>

				<div className="px-3 py-4 space-y-2">
					<button
						onClick={() => setIsUploadModalOpen(true)}
						className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
					>
						<Plus className="w-5 h-5" />
						<span className="font-medium">Upload File</span>
					</button>

					<button
						onClick={() => setIsCreateFolderOpen(true)}
						className={`w-full flex items-center justify-center space-x-2 border px-4 py-2 rounded-xl transition-all ${userProfile.darkMode ? "bg-gray-800 border-gray-600 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"} ${textMain}`}
					>
						<FolderPlus className="w-5 h-5" />
						<span className="font-medium">New Folder</span>
					</button>

					<button
						onClick={() => setIsGenerateModalOpen(true)}
						className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95`}
					>
						<Wand2 className="w-5 h-5" />
						<span className="font-medium">AI Studio</span>
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto px-2 space-y-1">
					{SIDEBAR_ITEMS.map((item) => (
						<button
							key={item.id}
							onClick={() => handleSidebarClick(item.id)}
							className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
								activeSidebar === item.id
									? "bg-indigo-500/10 text-indigo-500"
									: `${textSec} hover:bg-gray-500/10 ${textMain}`
							}`}
						>
							<item.icon
								className={`w-5 h-5 ${activeSidebar === item.id ? "text-indigo-500" : "text-gray-500"}`}
							/>
							<span>{item.label}</span>
						</button>
					))}
				</nav>
			</aside>

			{/* Main Content */}
			<div className="flex-1 flex flex-col min-w-0 h-full relative">
				{/* Header */}
				<header
					className={`h-16 border-b flex items-center justify-between px-4 lg:px-6 flex-shrink-0 ${bgPanel} ${borderCol}`}
				>
					<div className="flex-1 max-w-2xl mr-4">
						<div className="relative group">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search className={`h-5 w-5 ${textSec}`} />
							</div>
							<input
								type="text"
								placeholder="Search files..."
								className={`block w-full pl-10 pr-10 py-2.5 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all sm:text-sm ${userProfile.darkMode ? "bg-gray-800 text-white placeholder-gray-500" : "bg-gray-100 text-gray-900 placeholder-gray-500"}`}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<button
								onClick={() => setIsAiSearchOpen(true)}
								className={`absolute inset-y-0 right-0 pr-3 flex items-center ${textSec} hover:text-indigo-500 transition-colors`}
								title="Ask AI about your files"
							>
								<Sparkles className="h-5 w-5" />
							</button>
						</div>
					</div>

					<div className="flex items-center space-x-2 sm:space-x-4">
						<div
							className={`flex p-1 rounded-lg ${userProfile.darkMode ? "bg-gray-800" : "bg-gray-100"}`}
						>
							<button
								onClick={() => setViewMode("list")}
								className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow text-indigo-600 dark:bg-gray-700 dark:text-indigo-400" : `${textSec} hover:text-gray-900 dark:hover:text-white`}`}
								title="List view"
							>
								<List className="w-5 h-5" />
							</button>
							<button
								onClick={() => setViewMode("grid")}
								className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow text-indigo-600 dark:bg-gray-700 dark:text-indigo-400" : `${textSec} hover:text-gray-900 dark:hover:text-white`}`}
								title="Grid view"
							>
								<Grid className="w-5 h-5" />
							</button>
						</div>

						<div
							className={`h-6 w-px mx-2 hidden sm:block ${userProfile.darkMode ? "bg-gray-700" : "bg-gray-200"}`}
						></div>

						<button
							onClick={() => {
								setSettingsForm(userProfile);
								setIsSettingsOpen(true);
							}}
							className={`p-2 rounded-lg transition-colors ${textSec} hover:bg-gray-500/10`}
							title="Settings"
						>
							<Settings className="w-5 h-5" />
						</button>

						<div
							className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
							title={userProfile.name}
							style={{
								backgroundColor: userProfile.avatar ? "transparent" : "#e0e7ff",
								color: userProfile.avatar ? "transparent" : "#4338ca",
							}}
						>
							{userProfile.avatar ? (
								<img
									src={userProfile.avatar}
									alt="Profile"
									className="w-full h-full object-cover"
								/>
							) : (
								getInitials(userProfile.name)
							)}
						</div>
					</div>
				</header>

				{/* Toolbar & Breadcrumbs */}
				<div
					className={`px-4 lg:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b gap-4 min-h-[73px] ${borderCol}`}
				>
					<div className="flex-1 min-w-0">
						{activeSidebar === "my-files" && !searchQuery ? (
							<Breadcrumbs
								path={path}
								onNavigate={handleNavigate}
								darkMode={userProfile.darkMode}
							/>
						) : (
							<div className="flex items-center gap-4">
								{activeSidebar === "gallery" &&
								galleryTab === "albums" &&
								currentAlbum ? (
									<div className="flex items-center gap-2">
										<button
											onClick={() => setCurrentAlbum(null)}
											className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${textSec}`}
											title="Back to Albums"
										>
											<ArrowLeft className="w-5 h-5" />
										</button>
										<h2
											className={`text-xl font-bold capitalize tracking-tight ${textMain}`}
										>
											{currentAlbum.name}
										</h2>
									</div>
								) : (
									<div className="flex items-center gap-4">
										<h2
											className={`text-xl font-bold capitalize tracking-tight ${textMain}`}
										>
											{searchQuery
												? "Search Results"
												: activeSidebar.replace("-", " ")}
										</h2>

										{activeSidebar === "gallery" && (
											<div
												className={`flex rounded-lg p-1 text-sm font-medium ${userProfile.darkMode ? "bg-gray-800" : "bg-gray-100"}`}
											>
												<button
													onClick={() => handleGalleryTabChange("photos")}
													className={`px-3 py-1 rounded-md transition-all ${galleryTab === "photos" ? `bg-white shadow text-indigo-600 dark:bg-gray-700 dark:text-indigo-400` : textSec}`}
												>
													Photos
												</button>
												<button
													onClick={() => handleGalleryTabChange("albums")}
													className={`px-3 py-1 rounded-md transition-all ${galleryTab === "albums" ? `bg-white shadow text-indigo-600 dark:bg-gray-700 dark:text-indigo-400` : textSec}`}
												>
													Albums
												</button>
											</div>
										)}
									</div>
								)}

								{activeSidebar === "trash" && (
									<span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full font-medium ml-4">
										Items deleted after 30 days
									</span>
								)}
							</div>
						)}
					</div>

					<div className="flex items-center space-x-2">
						{activeSidebar === "gallery" &&
							galleryTab === "albums" &&
							!currentAlbum && (
								<button
									onClick={() => setIsCreateAlbumOpen(true)}
									className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
								>
									<Plus className="w-4 h-4" />
									<span>New Album</span>
								</button>
							)}

						{activeSidebar === "trash" && files.some((f) => f.isTrashed) && (
							<button
								onClick={() => setIsDeleteConfirmOpen(true)}
								className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
							>
								<Trash2 className="w-4 h-4" />
								<span>Empty Trash</span>
							</button>
						)}

						{selectedIds.size > 0 && (
							<div className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 animate-in fade-in slide-in-from-top-2 duration-200">
								<span className="text-sm font-semibold mr-2">
									{selectedIds.size} selected
								</span>

								{activeSidebar === "trash" ? (
									<>
										<button
											onClick={restoreFromTrash}
											className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
											title="Restore"
										>
											<RefreshCcw className="w-5 h-5" />
										</button>
										<div className="h-4 w-px bg-indigo-400 mx-1"></div>
										<button
											onClick={deletePermanently}
											className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
											title="Delete Permanently"
										>
											<Trash2 className="w-5 h-5" />
										</button>
									</>
								) : (
									<>
										{selectedIds.size === 1 && (
											<button
												onClick={() => {
													const id = Array.from(selectedIds)[0];
													const item = files.find((f) => f.id === id);
													if (item) {
														setRenameItem(item);
														setRenameValue(item.name);
													}
												}}
												className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
												title="Rename"
											>
												<Edit2 className="w-5 h-5" />
											</button>
										)}
										<button
											onClick={openMoveModal}
											className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
											title="Move to"
										>
											<FolderInput className="w-5 h-5" />
										</button>
										<button
											onClick={() => setIsAddToAlbumOpen(true)}
											className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
											title="Add to Album"
										>
											<Album className="w-5 h-5" />
										</button>

										<button
											className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
											title="Share"
										>
											<Share2 className="w-5 h-5" />
										</button>
										<button
											onClick={handleDownload}
											className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
											title="Download"
										>
											<Download className="w-5 h-5" />
										</button>
										<div className="h-4 w-px bg-indigo-400 mx-1"></div>
										<button
											onClick={moveToTrash}
											className="p-1.5 hover:bg-indigo-500 rounded-lg transition-colors"
											title="Move to Trash"
										>
											<Trash2 className="w-5 h-5" />
										</button>
									</>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Content & Preview Wrapper */}
				<div className="flex-1 flex overflow-hidden">
					<div
						className="flex-1 overflow-y-auto p-4 lg:p-6"
						role="presentation"
						onClick={() => setSelectedIds(new Set())}
					>
						{activeSidebar === "gallery" &&
						galleryTab === "albums" &&
						!currentAlbum ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
								{albums.map((album) => {
									const coverFile = files.find((f) => f.id === album.coverId);
									return (
										<div
											key={album.id}
											role="button"
											tabIndex={0}
											onKeyDown={(e) =>
												(e.key === "Enter" || e.key === " ") &&
												handleAlbumClick(album)
											}
											onClick={() => handleAlbumClick(album)}
											className="group cursor-pointer"
										>
											<div
												className={`aspect-square rounded-2xl overflow-hidden mb-3 border-2 ${itemBorder} relative`}
											>
												{coverFile ? (
													<img
														src={coverFile.previewUrl}
														alt={`${album.name} cover`}
														className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
													/>
												) : (
													<div
														className={`w-full h-full flex items-center justify-center ${userProfile.darkMode ? "bg-gray-800" : "bg-gray-100"}`}
													>
														<ImageIcon className="w-12 h-12 text-gray-300" />
													</div>
												)}
												<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
											</div>
											<h3 className={`font-semibold truncate ${textMain}`}>
												{album.name}
											</h3>
											<p className={`text-xs ${textSec}`}>
												{album.fileIds.length} items
											</p>
										</div>
									);
								})}
								<button
									type="button"
									onClick={() => setIsCreateAlbumOpen(true)}
									className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${userProfile.darkMode ? "border-gray-700 hover:border-indigo-500 hover:bg-gray-800" : "border-gray-200 hover:border-indigo-500 hover:bg-indigo-50"}`}
								>
									<Plus className="w-10 h-10 text-gray-400 mb-2" />
									<span className={`text-sm font-medium ${textSec}`}>
										Create Album
									</span>
								</button>
							</div>
						) : displayedItems.length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-gray-400">
								<div
									className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${userProfile.darkMode ? "bg-gray-800" : "bg-gray-100"}`}
								>
									{activeSidebar === "trash" ? (
										<Trash2 className="w-12 h-12 text-gray-300" />
									) : (
										<Folder className="w-12 h-12 text-gray-300" />
									)}
								</div>
								<p className={`text-xl font-semibold ${textSec}`}>
									{activeSidebar === "trash"
										? "Trash is empty"
										: currentAlbum
											? "Album is empty"
											: "No files found"}
								</p>
							</div>
						) : viewMode === "grid" || activeSidebar === "gallery" ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
								{displayedItems.map((item) => (
									<div
										key={item.id}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key !== "Enter" && e.key !== " ") return;
											e.stopPropagation();
											if (item.type === "folder") handleFolderClick(item);
											else selectSingle(item.id);
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (item.type === "folder") {
												handleFolderClick(item);
											} else {
												selectSingle(item.id);
											}
										}}
										onDoubleClick={(e) => {
											e.stopPropagation();
											if (item.type === "file") setPreviewFile(item);
											if (item.type === "folder") handleFolderClick(item);
										}}
										className={`group relative flex flex-col p-3 rounded-2xl border transition-all cursor-pointer duration-200 ${
											selectedIds.has(item.id)
												? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500"
												: `${itemBg} ${itemBorder} hover:shadow-lg`
										}`}
									>
										<div
											className={`relative aspect-[4/3] mb-3 rounded-xl flex items-center justify-center overflow-hidden ${userProfile.darkMode ? "bg-gray-700" : "bg-gray-50"}`}
										>
											<FileIcon
												type={item.type}
												fileType={item.fileType}
												className={
													item.type === "folder" || !item.previewUrl
														? "w-12 h-12"
														: "w-full h-full"
												}
												previewUrl={item.previewUrl}
											/>

											<div
												className={`absolute inset-0 bg-black/5 transition-opacity flex justify-between items-start p-2 ${selectedIds.has(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
											>
												<button
													onClick={(e) => toggleSelection(e, item.id)}
													className={`p-1 rounded-full transition-all bg-white shadow-sm hover:scale-110 ${selectedIds.has(item.id) ? "text-indigo-600" : "text-gray-400"}`}
												>
													{selectedIds.has(item.id) ? (
														<CheckCircle2 className="w-5 h-5 fill-current" />
													) : (
														<div className="w-5 h-5 rounded-full border-2 border-gray-300" />
													)}
												</button>

												{!item.isTrashed && (
													<button
														onClick={(e) => toggleStar(e, item.id)}
														className={`p-1 rounded-full bg-white shadow-sm hover:scale-110 ${item.starred ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
													>
														<Star className="w-5 h-5 fill-current" />
													</button>
												)}
											</div>
										</div>

										<div className="flex-1 min-w-0">
											<h3
												className={`text-sm font-semibold truncate ${textMain}`}
												title={item.name}
											>
												{item.name}
											</h3>
											<div className="flex items-center justify-between mt-1">
												<p className={`text-xs ${textSec}`}>
													{item.type === "folder" ? item.date : item.size}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="min-w-full inline-block align-middle">
								<div
									className={`border rounded-xl overflow-hidden shadow-sm ${bgPanel} ${borderCol}`}
								>
									<table className="min-w-full divide-y divide-gray-200/50">
										<thead
											className={
												userProfile.darkMode ? "bg-gray-800" : "bg-gray-50"
											}
										>
											<tr>
												<th scope="col" className="px-6 py-4 w-10"></th>
												<th
													scope="col"
													className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${textSec}`}
												>
													Name
												</th>
												<th
													scope="col"
													className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${textSec}`}
												>
													Date Modified
												</th>
												<th
													scope="col"
													className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell ${textSec}`}
												>
													Size
												</th>
												<th scope="col" className="relative px-6 py-4"></th>
											</tr>
										</thead>
										<tbody
											className={`divide-y ${userProfile.darkMode ? "divide-gray-700" : "divide-gray-100"}`}
										>
											{displayedItems.map((item) => (
												<tr
													key={item.id}
													onClick={(e) => {
														e.stopPropagation();
														if (item.type === "folder") handleFolderClick(item);
														else selectSingle(item.id);
													}}
													className={`cursor-pointer transition-colors group ${
														selectedIds.has(item.id)
															? "bg-indigo-500/10"
															: hoverBg
													}`}
												>
													<td className="px-6 py-4 whitespace-nowrap">
														<button
															onClick={(e) => toggleSelection(e, item.id)}
															className="focus:outline-none"
														>
															{selectedIds.has(item.id) ? (
																<CheckCircle2 className="w-5 h-5 text-indigo-500 fill-current" />
															) : (
																<div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-gray-400" />
															)}
														</button>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex items-center">
															<div
																className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${userProfile.darkMode ? "bg-gray-700" : "bg-gray-50"}`}
															>
																<FileIcon
																	type={item.type}
																	fileType={item.fileType}
																	className="w-6 h-6"
																	previewUrl={item.previewUrl}
																/>
															</div>
															<div className="ml-4">
																<div
																	className={`text-sm font-semibold transition-colors ${textMain}`}
																>
																	{item.name}
																</div>
																<div className={`text-xs ${textSec}`}>
																	{item.type}
																</div>
															</div>
														</div>
													</td>
													<td
														className={`px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell ${textSec}`}
													>
														{item.date}
													</td>
													<td
														className={`px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell ${textSec}`}
													>
														{item.size}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
														{!item.isTrashed && (
															<button
																onClick={(e) => toggleStar(e, item.id)}
																className="p-1 hover:bg-gray-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
															>
																<Star
																	className={`w-4 h-4 ${item.starred ? "text-yellow-400 fill-current" : "text-gray-400"}`}
																/>
															</button>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>

					{activeFile && previewPaneOpen && (
						<div
							className={`w-80 border-l flex flex-col transition-all duration-300 flex-shrink-0 animate-in slide-in-from-right-10 ${bgPanel} ${borderCol}`}
						>
							<div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
								<span className={`font-semibold ${textMain}`}>
									{activeFile.name}
								</span>
								<button
									onClick={() => setPreviewPaneOpen(false)}
									className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${textSec}`}
								>
									<X className="w-4 h-4" />
								</button>
							</div>
							<div className="p-4 flex-1 overflow-y-auto">
								<div
									className={`aspect-video rounded-xl flex items-center justify-center mb-6 overflow-hidden ${userProfile.darkMode ? "bg-gray-900" : "bg-gray-100"}`}
								>
									{activeFile.previewUrl ? (
										<img
											src={activeFile.previewUrl}
											alt={activeFile.name}
											className="w-full h-full object-contain"
										/>
									) : (
										<FileIcon
											type={activeFile.type}
											fileType={activeFile.fileType}
											className="w-20 h-20 opacity-50"
										/>
									)}
								</div>

								<h3
									className={`font-bold text-lg mb-1 break-words ${textMain}`}
								>
									{activeFile.name}
								</h3>
								<p className={`text-sm mb-6 ${textSec}`}>
									{activeFile.type} • {activeFile.size}
								</p>

								<div className="space-y-4">
									<div
										className={`p-4 rounded-xl border ${userProfile.darkMode ? "bg-indigo-900/20 border-indigo-800" : "bg-indigo-50 border-indigo-100"}`}
									>
										<div className="flex items-center space-x-2 mb-3">
											<Sparkles className="w-4 h-4 text-indigo-500" />
											<h4
												className={`text-sm font-semibold text-indigo-600 dark:text-indigo-400`}
											>
												AI Assistant
											</h4>
										</div>

										{isAiLoading ? (
											<div className="flex items-center justify-center py-4 text-indigo-500">
												<Loader2 className="w-5 h-5 animate-spin" />
												<span className="ml-2 text-sm">Thinking...</span>
											</div>
										) : aiResponse ? (
											<div className="animate-in fade-in">
												<div
													className={`text-sm leading-relaxed mb-3 p-3 rounded-lg ${userProfile.darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-700"}`}
												>
													<Bot className="w-4 h-4 mb-2 text-indigo-500" />
													{aiResponse}
												</div>
												<button
													onClick={() => setAiResponse("")}
													className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
												>
													Clear Result
												</button>
											</div>
										) : (
											<div className="space-y-2">
												{activeFile.type !== "folder" &&
													(activeFile.fileType === "text" ||
														activeFile.fileType === "pdf" ||
														activeFile.fileType === "word" ||
														activeFile.fileType === "excel") && (
														<button
															onClick={() => handleAISummary(activeFile)}
															className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${userProfile.darkMode ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50"}`}
														>
															<FileText className="w-4 h-4" />
															<span>Summarize Content</span>
														</button>
													)}
												{activeFile.fileType === "image" && (
													<button
														onClick={() => handleAIAnalyzeImage(activeFile)}
														className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${userProfile.darkMode ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50"}`}
													>
														<Eye className="w-4 h-4" />
														<span>Analyze Image</span>
													</button>
												)}
												{activeFile.type !== "folder" &&
													activeFile.fileType !== "image" &&
													activeFile.fileType !== "text" && (
														<button
															onClick={() => handleAISummary(activeFile)}
															className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${userProfile.darkMode ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50"}`}
														>
															<Bot className="w-4 h-4" />
															<span>Ask AI about this</span>
														</button>
													)}
											</div>
										)}
									</div>

									<div>
										<h4
											className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textSec}`}
										>
											Information
										</h4>
										<div className="space-y-3 text-sm">
											<div className="flex justify-between">
												<span className={textSec}>Type</span>
												<span className={textMain}>
													{activeFile.fileType || "Folder"}
												</span>
											</div>
											<div className="flex justify-between">
												<span className={textSec}>Size</span>
												<span className={textMain}>{activeFile.size}</span>
											</div>
											<div className="flex justify-between">
												<span className={textSec}>Created</span>
												<span className={textMain}>{activeFile.date}</span>
											</div>
											<div className="flex justify-between">
												<span className={textSec}>Location</span>
												<span className={textMain}>
													{currentFolder ? "Folder" : "My Files"}
												</span>
											</div>
										</div>
									</div>

									<div className="pt-4 border-t dark:border-gray-700 space-y-2">
										<button
											onClick={() => downloadFile(activeFile)}
											className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${textMain}`}
										>
											<Download className="w-4 h-4" />
											<span>Download</span>
										</button>
										<button
											onClick={() => setIsAddToAlbumOpen(true)}
											className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${textMain}`}
										>
											<Album className="w-4 h-4" />
											<span>Add to Album</span>
										</button>
										<button
											onClick={openMoveModal}
											className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${textMain}`}
										>
											<FolderInput className="w-4 h-4" />
											<span>Move to...</span>
										</button>
										{!activeFile.isTrashed ? (
											<button
												onClick={moveToTrash}
												className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-red-50 text-red-600 dark:hover:bg-red-900/30`}
											>
												<Trash2 className="w-4 h-4" />
												<span>Move to Trash</span>
											</button>
										) : (
											<button
												onClick={() => {
													setFiles(
														files.map((f) =>
															f.id === activeFile.id
																? { ...f, isTrashed: false }
																: f,
														),
													);
												}}
												className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-green-50 text-green-600 dark:hover:bg-green-900/30`}
											>
												<RefreshCcw className="w-4 h-4" />
												<span>Restore</span>
											</button>
										)}
										<button
											onClick={() => setPreviewFile(activeFile)}
											className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${textMain}`}
										>
											<Eye className="w-4 h-4" />
											<span>Full Preview</span>
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			{isDeleteConfirmOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${bgPanel}`}
					>
						<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 mx-auto">
							<AlertTriangle className="w-6 h-6" />
						</div>
						<h3 className={`text-xl font-bold text-center mb-2 ${textMain}`}>
							Empty Trash?
						</h3>
						<p className={`text-center text-sm mb-6 ${textSec}`}>
							Are you sure you want to permanently delete all items in the
							trash? This action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setIsDeleteConfirmOpen(false)}
								className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${userProfile.darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
							>
								Cancel
							</button>
							<button
								onClick={confirmEmptyTrash}
								className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-200 dark:shadow-none"
							>
								Yes, Delete All
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Move To Modal */}
			{isMoveModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-md p-6 ${bgPanel} flex flex-col max-h-[80vh]`}
					>
						<div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-100 dark:border-gray-700">
							<h3 className={`text-lg font-bold ${textMain}`}>Move to...</h3>
							<button
								onClick={() => setIsMoveModalOpen(false)}
								className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${textSec}`}
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto space-y-2 mb-4">
							{/* Root Folder Option */}
							<button
								onClick={() => setMoveTargetId(null)}
								className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors border ${
									moveTargetId === null
										? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
										: `${userProfile.darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"} ${textMain}`
								}`}
							>
								<Home className="w-5 h-5" />
								<span className="font-medium">My Files</span>
							</button>

							{/* Available Folders List */}
							{availableFolders.map((folder) => (
								<button
									key={folder.id}
									onClick={() => setMoveTargetId(folder.id)}
									className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors border ${
										moveTargetId === folder.id
											? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
											: `${userProfile.darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"} ${textMain}`
									}`}
								>
									<Folder className="w-5 h-5 fill-current opacity-70" />
									<span className="font-medium truncate">{folder.name}</span>
								</button>
							))}
						</div>

						<div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
							<button
								onClick={() => setIsMoveModalOpen(false)}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${textSec} hover:bg-gray-100 dark:hover:bg-gray-700`}
							>
								Cancel
							</button>
							<button
								onClick={handleMoveFiles}
								className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
							>
								Move Here
							</button>
						</div>
					</div>
				</div>
			)}

			{isGenerateModalOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col ${bgPanel}`}
					>
						<div
							className={`px-6 py-4 border-b flex justify-between items-center ${borderCol}`}
						>
							<h2
								className={`text-xl font-bold flex items-center gap-2 ${textMain}`}
							>
								<Wand2 className="w-6 h-6 text-purple-500" />
								AI Studio
							</h2>
							<button
								onClick={() => setIsGenerateModalOpen(false)}
								className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${textSec}`}
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						<div className={`flex border-b ${borderCol}`}>
							<button
								onClick={() => setGenerationType("image")}
								className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${generationType === "image" ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400" : `${textSec} hover:bg-gray-50 dark:hover:bg-gray-800`}`}
							>
								<ImageIcon className="w-4 h-4" />
								Imagen 4
							</button>
							<button
								onClick={() => setGenerationType("video")}
								className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${generationType === "video" ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400" : `${textSec} hover:bg-gray-50 dark:hover:bg-gray-800`}`}
							>
								<Film className="w-4 h-4" />
								Veo
							</button>
						</div>

						<div className="p-6">
							<div className="mb-4">
								<label
									htmlFor="gen-prompt"
									className={`block text-sm font-medium mb-2 ${textMain}`}
								>
									{generationType === "image"
										? "Describe the image you want to create"
										: "Describe the video you want to generate"}
								</label>
								<textarea
									id="gen-prompt"
									placeholder={
										generationType === "image"
											? "A futuristic city with flying cars, neon lights, 4k render..."
											: "A time-lapse of a blooming flower in a garden..."
									}
									className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-none ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`}
									value={generationPrompt}
									onChange={(e) => setGenerationPrompt(e.target.value)}
								/>
							</div>

							{generationType === "video" && (
								<div
									className={`p-3 rounded-lg text-sm mb-4 ${userProfile.darkMode ? "bg-yellow-900/20 text-yellow-200" : "bg-yellow-50 text-yellow-800"}`}
								>
									<p className="font-semibold">Veo Beta:</p>
									<p className="opacity-90">
										Veo generation is not yet available in this environment. A
										simulated preview will be created for demonstration.
									</p>
								</div>
							)}

							<button
								onClick={handleGeneration}
								disabled={isGenerating || !generationPrompt.trim()}
								className={`w-full py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 ${
									isGenerating || !generationPrompt.trim()
										? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
										: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/20 active:scale-95"
								}`}
							>
								{isGenerating ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										Creating with{" "}
										{generationType === "image" ? "Imagen 4" : "Veo"}...
									</>
								) : (
									<>
										<Wand2 className="w-5 h-5" />
										Generate {generationType === "image" ? "Image" : "Video"}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{isAiSearchOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[85vh] ${bgPanel}`}
					>
						<div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-100 dark:border-gray-700">
							<div className="flex items-center space-x-2">
								<Sparkles className="w-6 h-6 text-indigo-500" />
								<h3 className={`text-xl font-bold ${textMain}`}>
									Smart Search
								</h3>
							</div>
							<button
								onClick={() => setIsAiSearchOpen(false)}
								className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${textSec}`}
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto mb-4">
							{aiSearchResponse ? (
								<div
									className={`p-4 rounded-xl text-sm leading-relaxed ${userProfile.darkMode ? "bg-indigo-900/30 text-gray-200" : "bg-indigo-50 text-gray-800"}`}
								>
									<Bot className="w-5 h-5 mb-2 text-indigo-500" />
									<div className="whitespace-pre-wrap">{aiSearchResponse}</div>
								</div>
							) : (
								<div className={`text-center py-10 ${textSec}`}>
									<Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20" />
									<p>Ask anything about your files!</p>
									<p className="text-xs mt-2 opacity-60">
										"Where are my invoices?"
									</p>
									<p className="text-xs opacity-60">
										"Summarize my recent work"
									</p>
								</div>
							)}
						</div>

						<div className="relative">
							<input
								type="text"
								placeholder="Ask Gemini about your storage..."
								className={`w-full pl-4 pr-12 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900"}`}
								value={aiSearchQuery}
								onChange={(e) => setAiSearchQuery(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleGlobalAskAI()}
							/>
							<button
								onClick={handleGlobalAskAI}
								disabled={isAiSearchLoading || !aiSearchQuery.trim()}
								className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${isAiSearchLoading || !aiSearchQuery.trim() ? "opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
							>
								{isAiSearchLoading ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Send className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{isSettingsOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] ${bgPanel}`}
					>
						{/* Modal Header */}
						<div
							className={`px-6 py-4 border-b flex justify-between items-center ${borderCol}`}
						>
							<h2
								className={`text-xl font-bold flex items-center gap-2 ${textMain}`}
							>
								<Settings className="w-6 h-6 text-gray-500" />
								Settings
							</h2>
							<button
								onClick={() => setIsSettingsOpen(false)}
								className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${textSec}`}
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						<div className="flex flex-1 overflow-hidden">
							<div
								className={`w-1/3 border-r p-3 space-y-1 ${userProfile.darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}
							>
								{[
									{ id: "account", icon: User, label: "Account" },
									{ id: "preferences", icon: Bell, label: "Preferences" },
									{ id: "privacy", icon: Shield, label: "Privacy" },
								].map((tab) => (
									<button
										key={tab.id}
										onClick={() => setActiveSettingsTab(tab.id)}
										className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
											activeSettingsTab === tab.id
												? "bg-indigo-600 text-white shadow-md"
												: `${textSec} hover:bg-gray-500/10 ${textMain}`
										}`}
									>
										<tab.icon className="w-4 h-4" />
										<span>{tab.label}</span>
									</button>
								))}
							</div>

							<div className="flex-1 p-6 overflow-y-auto">
								{activeSettingsTab === "account" && (
									<div className="space-y-6">
										<div className="flex items-center space-x-4 mb-6">
											<div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden">
												{settingsForm.avatar ? (
													<img
														src={settingsForm.avatar}
														alt="Profile"
														className="w-full h-full object-cover"
													/>
												) : (
													getInitials(settingsForm.name)
												)}
											</div>
											<div>
												<button
													onClick={() => profilePicInputRef.current?.click()}
													className="text-sm text-indigo-500 font-medium hover:underline flex items-center gap-2"
												>
													<Camera className="w-4 h-4" />
													Change Profile Photo
												</button>
												<input
													type="file"
													ref={profilePicInputRef}
													className="hidden"
													accept="image/*"
													onChange={handleProfilePicUpdate}
												/>
												<p className={`text-xs mt-1 ${textSec}`}>
													Allowed *.jpeg, *.jpg, *.png
												</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<label
													htmlFor="settings-name"
													className={`block text-sm font-medium mb-1 ${textMain}`}
												>
													Display Name
												</label>
												<input
													id="settings-name"
													type="text"
													value={settingsForm.name}
													onChange={(e) =>
														setSettingsForm({
															...settingsForm,
															name: e.target.value,
														})
													}
													className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
												/>
											</div>
											<div>
												<label
													htmlFor="settings-email"
													className={`block text-sm font-medium mb-1 ${textMain}`}
												>
													Email Address
												</label>
												<input
													id="settings-email"
													type="email"
													value={settingsForm.email}
													onChange={(e) =>
														setSettingsForm({
															...settingsForm,
															email: e.target.value,
														})
													}
													className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
												/>
											</div>

											<div className={`pt-4 border-t ${borderCol}`}>
												<h3 className={`text-sm font-medium mb-3 ${textMain}`}>
													Password
												</h3>
												<div className="space-y-3">
													<input
														type="password"
														placeholder="Current Password"
														className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
													/>
													<input
														type="password"
														placeholder="New Password"
														className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
													/>
												</div>
											</div>
										</div>
									</div>
								)}

								{activeSettingsTab === "preferences" && (
									<div className="space-y-6">
										<div>
											<h3 className={`text-sm font-medium mb-4 ${textMain}`}>
												Notifications
											</h3>
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<div>
														<p className={`text-sm font-medium ${textMain}`}>
															Email Notifications
														</p>
														<p className={`text-xs ${textSec}`}>
															Receive emails about account activity
														</p>
													</div>
													<button
														onClick={() =>
															setSettingsForm({
																...settingsForm,
																notifications: !settingsForm.notifications,
															})
														}
														className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${settingsForm.notifications ? "bg-indigo-600" : "bg-gray-300"}`}
													>
														<span
															className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${settingsForm.notifications ? "translate-x-6" : "translate-x-1"}`}
														/>
													</button>
												</div>
											</div>
										</div>

										<div className={`pt-6 border-t ${borderCol}`}>
											<h3 className={`text-sm font-medium mb-4 ${textMain}`}>
												Appearance
											</h3>
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<Moon className={`w-5 h-5 ${textSec}`} />
													<div>
														<p className={`text-sm font-medium ${textMain}`}>
															Dark Mode
														</p>
														<p className={`text-xs ${textSec}`}>
															Reduce eye strain
														</p>
													</div>
												</div>
												<button
													onClick={() =>
														setSettingsForm({
															...settingsForm,
															darkMode: !settingsForm.darkMode,
														})
													}
													className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${settingsForm.darkMode ? "bg-indigo-600" : "bg-gray-300"}`}
												>
													<span
														className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${settingsForm.darkMode ? "translate-x-6" : "translate-x-1"}`}
													/>
												</button>
											</div>
										</div>
									</div>
								)}
								{activeSettingsTab === "privacy" && (
									<div className="space-y-6">
										<div className={`pt-6 border-t ${borderCol}`}>
											<button
												onClick={handleLogout}
												className="w-full flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl transition-colors"
											>
												<LogOut className="w-5 h-5" />
												<span>Sign out of all devices</span>
											</button>
										</div>
									</div>
								)}
							</div>
						</div>

						<div
							className={`px-6 py-4 border-t flex justify-end space-x-3 ${userProfile.darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}
						>
							<button
								onClick={() => setIsSettingsOpen(false)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${userProfile.darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
							>
								Cancel
							</button>
							<button
								onClick={saveSettings}
								className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
							>
								Save Changes
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Upload Modal */}
			{isUploadModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-md p-6 relative ${bgPanel}`}
					>
						<button
							onClick={() => setIsUploadModalOpen(false)}
							className={`absolute top-4 right-4 p-1 rounded-full ${textSec} hover:bg-gray-100`}
						>
							<X className="w-6 h-6" />
						</button>

						<h3 className={`text-xl font-bold mb-6 ${textMain}`}>Add Files</h3>

						{/* Local Upload */}
						<div
							className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group mb-6 ${userProfile.darkMode ? "border-gray-700 hover:bg-gray-800" : "border-indigo-200 hover:bg-indigo-50"}`}
							onClick={() => fileInputRef.current?.click()}
						>
							<div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
								<Cloud className="w-7 h-7" />
							</div>
							<p className={`text-sm font-medium ${textMain}`}>
								Click to upload local files
							</p>
							<input
								type="file"
								ref={fileInputRef}
								className="hidden"
								multiple
								onChange={handleFileUpload}
							/>
						</div>

						{/* Cloud Import Options */}
						<div>
							<p
								className={`text-xs font-semibold uppercase tracking-wider mb-3 ${textSec}`}
							>
								Or import from cloud
							</p>
							<div className="grid grid-cols-3 gap-3">
								<button
									onClick={() => handleCloudImport("Google Drive")}
									className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:shadow-md ${userProfile.darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}
								>
									<div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
										<Server className="w-4 h-4" />
									</div>
									<span className={`text-xs font-medium ${textMain}`}>
										Google Drive
									</span>
								</button>

								<button
									onClick={() => handleCloudImport("OneDrive")}
									className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:shadow-md ${userProfile.darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:border-cyan-400 hover:bg-cyan-50"}`}
								>
									<div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mb-2">
										<Cloud className="w-4 h-4" />
									</div>
									<span className={`text-xs font-medium ${textMain}`}>
										OneDrive
									</span>
								</button>

								<button
									onClick={() => handleCloudImport("Dropbox")}
									className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:shadow-md ${userProfile.darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50"}`}
								>
									<div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
										<Database className="w-4 h-4" />
									</div>
									<span className={`text-xs font-medium ${textMain}`}>
										Dropbox
									</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Create Folder Modal */}
			{isCreateFolderOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${bgPanel}`}
					>
						<h3 className={`text-lg font-bold mb-4 ${textMain}`}>New Folder</h3>
						<input
							type="text"
							placeholder="Folder name"
							className={`w-full px-4 py-3 rounded-lg border focus:border-indigo-500 outline-none transition-all ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
							value={newFolderName}
							onChange={(e) => setNewFolderName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && createFolder()}
						/>
						<div className="flex justify-end space-x-3 mt-6">
							<button
								onClick={() => setIsCreateFolderOpen(false)}
								className={`px-4 py-2 rounded-lg font-medium ${textSec} hover:bg-gray-100`}
							>
								Cancel
							</button>
							<button
								onClick={createFolder}
								className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
							>
								Create
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Create Album Modal */}
			{isCreateAlbumOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${bgPanel}`}
					>
						<h3 className={`text-lg font-bold mb-4 ${textMain}`}>New Album</h3>
						<input
							type="text"
							placeholder="Album name"
							className={`w-full px-4 py-3 rounded-lg border focus:border-indigo-500 outline-none transition-all ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
							value={newAlbumName}
							onChange={(e) => setNewAlbumName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && createAlbum()}
						/>
						<div className="flex justify-end space-x-3 mt-6">
							<button
								onClick={() => setIsCreateAlbumOpen(false)}
								className={`px-4 py-2 rounded-lg font-medium ${textSec} hover:bg-gray-100`}
							>
								Cancel
							</button>
							<button
								onClick={createAlbum}
								className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
							>
								Create
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add To Album Modal */}
			{isAddToAlbumOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${bgPanel}`}
					>
						<h3 className={`text-lg font-bold mb-4 ${textMain}`}>
							Add to Album
						</h3>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{albums.map((album) => (
								<button
									key={album.id}
									onClick={() => addToAlbum(album.id)}
									className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${userProfile.darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
								>
									<div
										className={`w-10 h-10 rounded-lg flex items-center justify-center ${userProfile.darkMode ? "bg-gray-700" : "bg-gray-200"}`}
									>
										<Album className="w-5 h-5 text-gray-500" />
									</div>
									<div className="text-left">
										<p className={`font-medium ${textMain}`}>{album.name}</p>
										<p className={`text-xs ${textSec}`}>
											{album.fileIds.length} items
										</p>
									</div>
								</button>
							))}
							<button
								onClick={() => {
									setIsAddToAlbumOpen(false);
									setIsCreateAlbumOpen(true);
								}}
								className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
							>
								<Plus className="w-4 h-4" />
								<span>Create New Album</span>
							</button>
						</div>
						<div className="flex justify-end space-x-3 mt-6">
							<button
								onClick={() => setIsAddToAlbumOpen(false)}
								className={`px-4 py-2 rounded-lg font-medium ${textSec} hover:bg-gray-100`}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Rename Modal */}
			{renameItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div
						className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${bgPanel}`}
					>
						<h3 className={`text-lg font-bold mb-4 ${textMain}`}>Rename</h3>
						<input
							type="text"
							className={`w-full px-4 py-3 rounded-lg border focus:border-indigo-500 outline-none transition-all ${userProfile.darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
							value={renameValue}
							onChange={(e) => setRenameValue(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleRename()}
						/>
						<div className="flex justify-end space-x-3 mt-6">
							<button
								onClick={() => setRenameItem(null)}
								className={`px-4 py-2 rounded-lg font-medium ${textSec} hover:bg-gray-100`}
							>
								Cancel
							</button>
							<button
								onClick={handleRename}
								className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
							>
								Save
							</button>
						</div>
					</div>
				</div>
			)}

			{/* File Full Screen Preview Modal */}
			{previewFile && (
				<div
					className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
					onClick={() => setPreviewFile(null)}
				>
					<div
						className="max-w-6xl max-h-[95vh] w-full flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-center text-white mb-4">
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-white/10 rounded-lg">
									<FileIcon
										type={previewFile.type}
										fileType={previewFile.fileType}
										className="w-6 h-6 text-white"
									/>
								</div>
								<div>
									<h3 className="font-semibold text-lg">{previewFile.name}</h3>
									<p className="text-sm text-gray-400">
										{previewFile.size} • {previewFile.date}
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<button
									onClick={() => downloadFile(previewFile)}
									className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
									title="Download"
								>
									<Download className="w-6 h-6" />
								</button>
								<button
									onClick={() => setPreviewFile(null)}
									className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
								>
									<X className="w-6 h-6" />
								</button>
							</div>
						</div>

						<div className="flex-1 bg-black/50 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl relative min-h-[400px]">
							{previewFile.fileType === "image" && previewFile.previewUrl ? (
								<img
									src={previewFile.previewUrl}
									alt="preview"
									className="max-w-full max-h-[80vh] object-contain"
								/>
							) : previewFile.fileType === "video" && previewFile.previewUrl ? (
								<video
									controls
									src={previewFile.previewUrl}
									className="max-w-full max-h-[80vh]"
								/>
							) : (
								<div className="text-center text-gray-300">
									<FileText className="w-24 h-24 mx-auto mb-4 opacity-50" />
									<p className="text-xl">No preview available</p>
									<p className="text-sm text-gray-500 mt-2">
										Download the file to view content
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

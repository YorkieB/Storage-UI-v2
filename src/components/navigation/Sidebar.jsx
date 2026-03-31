import { Cloud, FolderPlus, Plus, Wand2 } from "lucide-react";

const Sidebar = ({
	sidebarItems,
	activeSidebar,
	onSidebarClick,
	onUploadClick,
	onNewFolderClick,
	onAiStudioClick,
	bgPanel,
	borderCol,
	textMain,
	textSec,
	darkMode,
}) => (
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
				type="button"
				onClick={onUploadClick}
				className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
			>
				<Plus className="w-5 h-5" />
				<span className="font-medium">Upload File</span>
			</button>

			<button
				type="button"
				onClick={onNewFolderClick}
				className={`w-full flex items-center justify-center space-x-2 border px-4 py-2 rounded-xl transition-all ${
					darkMode
						? "bg-gray-800 border-gray-600 hover:bg-gray-700"
						: "bg-white border-gray-200 hover:bg-gray-50"
				} ${textMain}`}
			>
				<FolderPlus className="w-5 h-5" />
				<span className="font-medium">New Folder</span>
			</button>

			<button
				type="button"
				onClick={onAiStudioClick}
				className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95"
			>
				<Wand2 className="w-5 h-5" />
				<span className="font-medium">AI Studio</span>
			</button>
		</div>

		<nav className="flex-1 overflow-y-auto px-2 space-y-1">
			{sidebarItems.map((item) => (
				<button
					key={item.id}
					type="button"
					onClick={() => onSidebarClick(item.id)}
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
);

export default Sidebar;

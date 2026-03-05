// Level Config page styles
const levelConfigStyles = {
    levelContainer: "",
    levelSuccessMessage: "fixed top-5 right-5 z-50 animate-slideIn",
    levelSuccessContent: "bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3",
    levelSuccessIcon: "w-5 h-5",
    levelSuccessText: "font-medium",

    levelHeader: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",
    levelHeaderLeft: "flex items-center gap-4",
    levelTitle: "text-2xl font-bold text-white",

    levelTableWrapper: "relative overflow-x-auto shadow-2xl rounded-lg border border-[#222222] bg-[#111111]",
    levelSearchHeader: "p-4 border-b border-[#222222] flex items-center justify-between",
    levelTable: "w-full text-sm text-left text-gray-300",
    levelThead: "text-xs text-white uppercase bg-[#8b0000] border-b border-[#222222]",
    levelTh: "px-6 py-4 font-semibold tracking-wider",
    levelTr: "bg-[#0d0d0d] border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors",
    levelTd: "px-6 py-4",
    levelTdBold: "px-6 py-4 font-medium text-white",

    levelNumber: "font-semibold",
    levelPercentage: "text-yellow-500 font-semibold",
    levelVolume: "text-blue-400",

    levelAddButton: "bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
    levelAddIcon: "w-4 h-4",

    levelActionCell: "px-6 py-4 text-center relative",
    levelActionButton: "text-gray-400 hover:text-white transition-colors",
    levelActionIcon: "w-5 h-5",

    levelDropdownMenu: "absolute right-8 top-8 w-32 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl z-40 overflow-hidden text-left",
    levelDropdownItem: "px-4 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white cursor-pointer transition-colors",
    levelDropdownItemDelete: "px-4 py-2 text-sm text-red-500 hover:bg-[#333] hover:text-red-400 cursor-pointer transition-colors border-t border-[#333]",

    levelNoData: "py-8 text-center text-gray-500",

    levelModalOverlay: "fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4",
    levelModal: "bg-[#111] border border-[#333] rounded-xl w-full max-w-md shadow-2xl overflow-hidden",
    levelModalForm: "bg-[#111] border border-[#333] rounded-xl w-full max-w-md shadow-2xl",
    levelModalHeader: "px-6 py-4 border-b border-[#333] flex items-center justify-between",
    levelModalTitle: "text-xl font-bold text-white",
    levelModalBody: "p-6",
    levelModalText: "text-gray-300 mb-6",
    levelModalStatus: "font-semibold",
    levelModalStatusActive: "text-green-500",
    levelModalStatusInactive: "text-red-500",
    levelModalActions: "flex gap-3 justify-end",
    levelModalCancel: "px-4 py-2 rounded-md bg-transparent border border-[#444] text-gray-300 hover:bg-[#222] transition-colors font-medium text-sm",
    levelModalConfirm: "px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-600 transition-colors font-medium text-sm",
    levelModalClose: "text-gray-400 hover:text-white transition-colors",
    levelModalCloseIcon: "w-6 h-6",
    levelModalFormBody: "p-6 space-y-4",
    levelModalField: "",
    levelModalLabel: "block text-sm font-medium text-gray-400 mb-1",
    levelModalInput: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500",
    levelModalSelect: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500",
    levelModalFormActions: "pt-4 flex gap-3 justify-end",

    levelAnimations: `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .animate-slideIn {
            animation: slideIn 0.3s ease-out;
        }
    `,
};

export default levelConfigStyles;

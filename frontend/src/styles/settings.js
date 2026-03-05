// Settings page styles
const settingsStyles = {
    settingsContainer: "",
    settingsSuccessMessage: "fixed top-5 right-5 z-50 animate-slideIn",
    settingsSuccessContent: "bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3",
    settingsSuccessIcon: "w-5 h-5",
    settingsSuccessText: "font-medium",

    settingsHeader: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",
    settingsHeaderLeft: "flex items-center gap-4",
    settingsTitle: "text-2xl font-bold text-white",

    settingsTabContainer: "flex items-center gap-2 bg-[#111] p-1 rounded-lg border border-[#333]",
    settingsTabButton: "px-4 py-2 rounded-md text-sm font-medium transition-all",
    settingsTabActive: "bg-red-700 text-white shadow-lg",
    settingsTabInactive: "text-gray-400 hover:text-white hover:bg-[#1a1a1a]",

    settingsProfileCard: "bg-[#0a0a0a] rounded-lg border border-[#222] overflow-hidden",
    settingsProfileHeader: "p-6 border-b border-[#222]",
    settingsProfileHeaderContent: "flex items-center gap-4",
    settingsAvatar: "w-20 h-20 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-3xl font-bold text-white",
    settingsProfileName: "text-2xl font-bold text-white",
    settingsProfileCode: "text-gray-400 text-sm",
    settingsProfileMember: "text-gray-500 text-xs mt-1",

    settingsProfileStats: "grid grid-cols-2 gap-4 p-6 border-b border-[#222] bg-[#111]",
    settingsStatItem: "text-center",
    settingsStatValue: "text-2xl font-bold text-red-500",
    settingsStatLabel: "text-xs text-gray-400",

    settingsProfileDetails: "p-6 space-y-6",
    settingsDetailItem: "flex items-start gap-4",
    settingsDetailIcon: "w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-red-500",
    settingsIcon: "w-4 h-4",
    settingsDetailContent: "flex-1",
    settingsDetailLabel: "text-xs text-gray-500 uppercase",
    settingsDetailText: "text-white",
    settingsDetailInput: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 mt-1 text-sm",
    settingsDetailSelect: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 mt-1 text-sm",
    settingsMonoText: "font-mono",
    settingsBreakAll: "break-all",

    settingsActionButtons: "flex flex-wrap gap-3 pt-4 border-t border-[#222]",
    settingsSaveButton: "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2",
    settingsCancelButton: "px-4 py-2 bg-transparent border border-[#444] hover:bg-[#222] text-gray-300 rounded-md text-sm font-medium transition-colors",
    settingsEditButton: "px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2",
    settingsPasswordButton: "px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-[#333]",
    settingsLogoutButton: "px-4 py-2 bg-transparent hover:bg-[#1a1a1a] text-red-500 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-red-900/50",
    settingsButtonIcon: "w-4 h-4",

    settingsSupportCard: "bg-[#0a0a0a] rounded-lg border border-[#222] overflow-hidden",
    settingsSupportContent: "p-4",
    settingsSearchHeader: "p-4 border-b border-[#222222]",

    settingsBadgeBase: "px-2 py-1 rounded text-xs font-semibold",
    settingsBadgeOpen: "bg-green-900/30 text-green-400 border border-green-800/50",
    settingsBadgePending: "bg-yellow-900/30 text-yellow-400 border border-yellow-800/50",
    settingsBadgeClosed: "bg-gray-900/30 text-gray-400 border border-gray-800/50",
    settingsBadgeHigh: "bg-red-900/30 text-red-400 border border-red-800/50",
    settingsBadgeMedium: "bg-blue-900/30 text-blue-400 border border-blue-800/50",
    settingsBadgeLow: "bg-green-900/30 text-green-400 border border-green-800/50",

    settingsTicketId: "font-mono text-xs bg-[#1a1a1a] px-2 py-1 rounded",
    settingsTicketSubject: "max-w-xs truncate",

    settingsActionCell: "px-6 py-4 text-center relative",
    settingsActionButton: "text-gray-400 hover:text-white transition-colors",
    settingsActionIcon: "w-5 h-5",

    settingsDropdownMenu: "absolute right-8 top-8 w-32 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl z-40 overflow-hidden text-left",
    settingsDropdownItem: "px-4 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white cursor-pointer transition-colors",
    settingsDropdownItemDelete: "px-4 py-2 text-sm text-red-500 hover:bg-[#333] hover:text-red-400 cursor-pointer transition-colors border-t border-[#333]",

    settingsNoData: "py-12 text-center",
    settingsNoDataContent: "flex flex-col items-center justify-center text-gray-500",
    settingsNoDataIcon: "w-16 h-16 mb-4 text-gray-600",
    settingsNoDataTitle: "text-lg",
    settingsNoDataSubtitle: "text-sm text-gray-600 mt-1",

    settingsTotalCount: "text-sm text-gray-400 ml-2",
    settingsPageInfo: "flex items-center mx-2 gap-1",
    settingsPageText: "text-white",

    settingsModalOverlay: "fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4",
    settingsModal: "bg-[#111] border border-[#333] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto",
    settingsModalSmall: "bg-[#111] border border-[#333] rounded-xl w-full max-w-md shadow-2xl overflow-hidden",
    settingsModalHeader: "px-6 py-4 border-b border-[#333] flex items-center justify-between sticky top-0 bg-[#111]",
    settingsModalTitle: "text-xl font-bold text-white",
    settingsModalClose: "text-gray-400 hover:text-white transition-colors",
    settingsModalCloseIcon: "w-6 h-6",
    settingsModalBody: "p-6 space-y-4",
    settingsModalGrid: "grid grid-cols-2 gap-4",
    settingsModalField: "",
    settingsModalFieldFull: "col-span-2",
    settingsModalLabel: "text-xs text-gray-500 uppercase mb-1",
    settingsModalValue: "text-white",
    settingsModalSubject: "text-white bg-[#1a1a1a] p-3 rounded-lg",
    settingsModalActions: "pt-4 flex gap-3 justify-end",
    settingsModalConfirm: "px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-600 transition-colors font-medium text-sm",
    settingsModalCancel: "px-4 py-2 rounded-md bg-transparent border border-[#444] text-gray-300 hover:bg-[#222] transition-colors font-medium text-sm",
    settingsModalForm: "p-6 space-y-4",
    settingsModalInput: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500",
    settingsModalSelect: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500",
    settingsModalTextarea: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500",
    settingsModalFormActions: "pt-4 flex gap-3 justify-end",
    settingsModalDelete: "px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-600 transition-colors font-medium text-sm",
    settingsModalLogout: "px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2",

    settingsDeleteContent: "flex items-center gap-4 mb-6",
    settingsDeleteIcon: "w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center",
    settingsDeleteIconSvg: "w-6 h-6 text-red-500",
    settingsDeleteText: "text-gray-300",

    settingsLogoutContent: "flex items-center gap-4 mb-6",
    settingsLogoutIcon: "w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center",
    settingsLogoutIconSvg: "w-6 h-6 text-yellow-500",
    settingsLogoutText: "text-gray-300",

    settingsAnimations: `
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

export default settingsStyles;

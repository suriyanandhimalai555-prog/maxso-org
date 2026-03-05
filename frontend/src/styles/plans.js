// Plans + Portfolio styles
const plansStyles = {
    // Plans Page
    planContainer: "",
    planSuccessMessage: "fixed top-5 right-5 z-50 animate-slideIn",
    planSuccessContent: "bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3",
    planSuccessText: "font-medium",

    planHeader: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",
    planHeaderLeft: "flex items-center gap-4",
    planTitle: "text-2xl font-bold text-white",

    planActionBar: "flex flex-col md:flex-row justify-between items-center gap-4 mb-6",
    planAddButton: "bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",

    planGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",

    planCard: "relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#800000] to-[#4a0000] p-8 shadow-2xl",
    planWaveOverlay: "absolute top-0 left-0 w-full h-24 bg-white/5 rounded-b-[50%] -translate-y-12",
    planCardHeader: "flex justify-between items-start mb-8 relative z-10",
    planCardTitle: "text-3xl font-bold",
    planCardActions: "flex items-center gap-3",

    planStatusWrapper: "flex items-center gap-2 bg-black/30 rounded-full px-3 py-1 border border-white/10",
    planStatusText: "text-xs font-medium",
    planToggleButton: "w-10 h-5 rounded-full relative transition-colors",
    planToggleActive: "bg-green-500",
    planToggleInactive: "bg-gray-600",
    planToggleDot: "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
    planToggleDotActive: "right-1",
    planToggleDotInactive: "left-1",

    planActionMenuContainer: "relative",
    planActionButton: "p-2 bg-white/10 rounded-lg hover:bg-white/20",
    planDropdownMenu: "absolute right-0 top-10 w-32 bg-[#1a1a1a] border border-[#333] rounded-md shadow-xl z-50 overflow-hidden",
    planDropdownItem: "px-4 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white cursor-pointer transition-colors",
    planDropdownItemDelete: "px-4 py-2 text-sm text-red-500 hover:bg-[#333] hover:text-red-400 cursor-pointer transition-colors border-t border-[#333]",

    planDetails: "space-y-4 relative z-10",
    planDetailItem: "flex items-start gap-3",
    planDetailIcon: "text-white mt-1 shrink-0",
    planDetailText: "text-sm leading-tight",
    planDetailLabel: "font-semibold",
    planDetailValue: "text-white/90",

    planCreatedAt: "mt-6 pt-4 border-t border-white/10 text-xs text-gray-400",

    planStatusActive: "bg-green-900/30 text-green-400 border border-green-800/50",
    planStatusInactive: "bg-gray-900/30 text-gray-400 border border-gray-800/50",

    // Plan Admin Modal
    planModalOverlay: "fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4",
    planModal: "bg-[#111] border border-[#333] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto",
    planModalHeader: "px-6 py-4 border-b border-[#333] flex items-center justify-between sticky top-0 bg-[#111]",
    planModalTitle: "text-xl font-bold text-white",
    planModalClose: "text-gray-400 hover:text-white transition-colors",
    planModalCloseIcon: "w-6 h-6",
    planModalForm: "p-6 space-y-4",
    planModalGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
    planModalField: "",
    planModalFieldFull: "md:col-span-2",
    planModalLabel: "block text-sm font-medium text-gray-400 mb-1",
    planModalInput: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500",
    planModalSelect: "w-full bg-[#1a1a1a] text-white border border-[#333] rounded-md px-3 py-2 outline-none focus:border-red-500",
    planModalActions: "pt-4 flex gap-3 justify-end",
    planModalCancel: "px-4 py-2 rounded-md bg-transparent border border-[#444] text-gray-300 hover:bg-[#222] transition-colors font-medium text-sm",
    planModalSubmit: "px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-600 transition-colors font-medium text-sm",

    planAnimations: `
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

    // Buy Plan
    planBuyButton: "mt-6 w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 hover:shadow-red-900/50 hover:scale-[1.02] active:scale-[0.98] relative z-10",
    planBuyButtonDisabled: "mt-6 w-full bg-gray-700 text-gray-400 font-bold py-3 px-6 rounded-xl cursor-not-allowed relative z-10",

    planBuyModalOverlay: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm",
    planBuyModal: "relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl",
    planBuyModalBg: "absolute inset-0 bg-gradient-to-br from-[#800000] to-[#1a0000]",
    planBuyModalDecor: "absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full -translate-y-8 translate-x-8",
    planBuyModalContent: "relative p-6 z-10",
    planBuyModalHeader: "flex items-center justify-between mb-6",
    planBuyModalTitle: "text-2xl font-bold text-white",
    planBuyModalClose: "text-white/60 hover:text-white transition-colors cursor-pointer",
    planBuyModalCloseIcon: "w-6 h-6",
    planBuyModalField: "mb-5",
    planBuyModalLabel: "block text-sm font-semibold text-white/90 mb-2",
    planBuyModalInput: "w-full bg-black/30 text-white border border-white/20 rounded-lg px-4 py-3 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all placeholder-white/30",
    planBuyModalSelect: "w-full bg-black/30 text-white border border-white/20 rounded-lg px-4 py-3 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all appearance-none cursor-pointer",
    planBuyModalHint: "text-xs text-white/50 mt-1",
    planBuyModalSubmit: "w-full bg-white text-[#800000] font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all mt-2 shadow-lg",
    planBuyModalError: "bg-red-900/50 border border-red-500/50 text-red-200 text-sm px-4 py-2 rounded-lg mb-4",

    // Portfolio Page
    portfolioContainer: "",
    portfolioHeader: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",
    portfolioHeaderLeft: "flex items-center gap-4",
    portfolioTitle: "text-2xl font-bold text-white",
    portfolioGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6",

    portfolioCard: "relative rounded-2xl overflow-hidden shadow-2xl",
    portfolioCardBg: "absolute inset-0 bg-gradient-to-b from-[#0a0020] via-[#1a0030] to-[#800000]",
    portfolioCardContent: "relative p-6 z-10",

    portfolioIconWrapper: "flex justify-center mb-4",
    portfolioIcon: "w-16 h-16 rounded-full bg-gradient-to-br from-red-900/80 to-red-600/40 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)]",
    portfolioIconSvg: "w-8 h-8 text-white",

    portfolioPlanName: "text-2xl font-bold text-white mb-3",
    portfolioDetail: "text-sm mb-1",
    portfolioDetailLabel: "text-gray-300",
    portfolioDetailRed: "text-red-400 font-semibold",
    portfolioDetailGreen: "text-green-400 font-semibold",
    portfolioDetailYellow: "text-yellow-400 font-semibold",

    portfolioProgressWrapper: "mt-4 mb-3",
    portfolioProgressHeader: "flex justify-between items-center mb-1",
    portfolioProgressLabel: "text-xs text-gray-400",
    portfolioProgressValue: "text-xs text-white font-semibold",
    portfolioProgressBar: "w-full h-2 bg-gray-800 rounded-full overflow-hidden",
    portfolioProgressFill: "h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500",

    portfolioFooter: "mt-3 space-y-1",
    portfolioFooterText: "text-sm",
    portfolioStatusOngoing: "font-bold text-green-400",
    portfolioStatusCompleted: "font-bold text-blue-400",
    portfolioStatusCancelled: "font-bold text-red-400",

    portfolioNoData: "flex flex-col items-center justify-center py-20 text-gray-500",
    portfolioNoDataIcon: "w-20 h-20 mb-4 text-gray-600",
    portfolioNoDataTitle: "text-xl text-gray-400",
    portfolioNoDataSubtitle: "text-sm text-gray-600 mt-2",

    portfolioAnimations: `
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

export default plansStyles;
